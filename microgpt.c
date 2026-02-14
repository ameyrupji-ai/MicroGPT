// This is a C# port of @karpathy microgpt python script (https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95)
// It's the closest I could get using C#.
// Use with caution as it could be wrong, but it does seem to get similar outputs

namespace MicroGpt;

public class Value(double data, Value[]? children = null)
{
    private readonly Value[] _children = children ?? [];
    private Action _backward = () => { };
    public double Data { get; set; } = data;
    public double Grad { get; set; }
        
    public static Value operator +(Value a, Value b)
    {
        var outNode = new Value(a.Data + b.Data, [a, b]);
        outNode._backward = () =>
        {
            a.Grad += outNode.Grad;
            b.Grad += outNode.Grad;
        };
        return outNode;
    }

    public static Value operator *(Value a, Value b)
    {
        var outNode = new Value(a.Data * b.Data, [a, b]);
        outNode._backward = () =>
        {
            a.Grad += b.Data * outNode.Grad;
            b.Grad += a.Data * outNode.Grad;
        };
        return outNode;
    }

    public Value Pow(double other)
    {
        var outNode = new Value(Math.Pow(Data, other), [this]);
        outNode._backward = () =>
        {
            Grad += other * Math.Pow(Data, other - 1) * outNode.Grad;
        };
        return outNode;
    }

    public Value Exp()
    {
        var outNode = new Value(Math.Exp(Data), [this]);
        outNode._backward = () => Grad += outNode.Data * outNode.Grad;
        return outNode;
    }

    public Value Log()
    {
        var outNode = new Value(Math.Log(Data), [this]);
        outNode._backward = () => Grad += (1.0 / Data) * outNode.Grad;
        return outNode;
    }

    public Value Relu()
    {
        var outNode = new Value(Data < 0 ? 0 : Data, [this]);
        outNode._backward = () => Grad += (Data > 0 ? 1 : 0) * outNode.Grad;
        return outNode;
    }

    public static Value operator -(Value a, Value b) => a + b * -1;
    public static Value operator -(Value a) => a * -1;
    public static Value operator /(Value a, Value b) => a * b.Pow(-1);
    public static implicit operator Value(double d) => new(d);
    public static Value operator +(Value a, double b) => a + new Value(b);
    public static Value operator *(Value a, double b) => a * new Value(b);

    public void Backward()
    {
        var topo = new List<Value>();
        var visited = new HashSet<Value>();
        BuildTopo(this);
        Grad = 1.0;
        topo.Reverse();
        foreach (var v in topo) v._backward();
        return;

        void BuildTopo(Value v)
        {
            if (!visited.Add(v)) return;
            foreach (var child in v._children) BuildTopo(child);
            topo.Add(v);
        }
    }
}

internal static class Program
{
    private const int NEmbd = 16;
    private const int NHead = 4;
    private const int NLayer = 1;
    private const int BlockSize = 16;
    private const int HeadDim = NEmbd / NHead;
    private static int _vocabSize;

    private static readonly List<Value> AllParams = [];
    private static readonly Dictionary<string, Value[][]> StateDict = new();
    private static readonly Random Rng = new(42);

    private static Value[][] Matrix(int rows, int cols)
    {
        var mat = new Value[rows][];
        for (var i = 0; i < rows; i++)
        {
            mat[i] = new Value[cols];
            for (var j = 0; j < cols; j++)
            {
                var val = new Value(Gaussian(0, 0.08));
                mat[i][j] = val;
                AllParams.Add(val);
            }
        }
        return mat;
    }

    private static double Gaussian(double mean, double std)
    {
        var u1 = 1.0 - Rng.NextDouble();
        var u2 = 1.0 - Rng.NextDouble();
        var randStdNormal = Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Sin(2.0 * Math.PI * u2);
        return mean + std * randStdNormal;
    }

    private static List<Value> Linear(List<Value> x, Value[][] w)
    {
        var outList = new List<Value>(w.Length);
        foreach (var t in w)
        {
            Value sum = 0;
            for (var j = 0; j < x.Count; j++)
            {
                sum += t[j] * x[j];
            }
            outList.Add(sum);
        }
        return outList;
    }

    private static List<Value> Softmax(List<Value> logits)
    {
        var maxVal = logits.Max(l => l.Data);
        var exps = logits.Select(l => (l - maxVal).Exp()).ToList();
        var sum = exps.Aggregate((a, b) => a + b);
        return exps.Select(e => e / sum).ToList();
    }

    private static List<Value> RmsNorm(List<Value> x)
    {
        var ms = x.Aggregate((Value)0, (acc, xi) => acc + xi * xi) / x.Count;
        var scale = (ms + 1e-5).Pow(-0.5);
        return x.Select(xi => xi * scale).ToList();
    }

    private static List<Value> Gpt(int tokenId, int posId, List<List<List<Value>>> keys, List<List<List<Value>>> values)
    {
        var tokEmb = StateDict["wte"][tokenId];
        var posEmb = StateDict["wpe"][posId];
            
        var x = tokEmb.Zip(posEmb, (t, p) => t + p).ToList();
        x = RmsNorm(x);

        for (var li = 0; li < NLayer; li++)
        {
            var xResidual = new List<Value>(x);
            x = RmsNorm(x);

            var q = Linear(x, StateDict[$"layer{li}.attn_wq"]);
            var k = Linear(x, StateDict[$"layer{li}.attn_wk"]);
            var v = Linear(x, StateDict[$"layer{li}.attn_wv"]);

            keys[li].Add(k);
            values[li].Add(v);

            var xAttn = new List<Value>();

            for (var h = 0; h < NHead; h++)
            {
                var hs = h * HeadDim;
                var qH = q.Skip(hs).Take(HeadDim).ToList();
                    
                var kHAll = keys[li].Select(ki => ki.Skip(hs).Take(HeadDim).ToList()).ToList();
                var vHAll = values[li].Select(vi => vi.Skip(hs).Take(HeadDim).ToList()).ToList();

                var attnLogits = new List<Value>();
                foreach (var kHt in kHAll)
                {
                    Value dot = 0;
                    for (var j = 0; j < HeadDim; j++) dot += qH[j] * kHt[j];
                    attnLogits.Add(dot / Math.Sqrt(HeadDim));
                }
                var attnWeights = Softmax(attnLogits);

                for (var j = 0; j < HeadDim; j++)
                {
                    Value valSum = 0;
                    for (var t = 0; t < vHAll.Count; t++)
                    {
                        valSum += attnWeights[t] * vHAll[t][j];
                    }
                    xAttn.Add(valSum);
                }
            }

            x = Linear(xAttn, StateDict[$"layer{li}.attn_wo"]);
                
            x = x.Zip(xResidual, (a, b) => a + b).ToList();

            xResidual = new List<Value>(x);
            x = RmsNorm(x);
            x = Linear(x, StateDict[$"layer{li}.mlp_fc1"]);
            x = x.Select(xi => xi.Relu()).ToList();
            x = Linear(x, StateDict[$"layer{li}.mlp_fc2"]);
            x = x.Zip(xResidual, (a, b) => a + b).ToList();
        }

        return Linear(x, StateDict["lm_head"]);
    }

    private static async Task Main(string[] args)
    {
        Console.WriteLine("Initializing minGPT (C# Port)...");

        const string inputPath = "input.txt";
        if (!File.Exists(inputPath))
        {
            Console.WriteLine("Downloading input.txt...");
            using var client = new HttpClient();
            var data = await client.GetStringAsync("https://raw.githubusercontent.com/karpathy/makemore/refs/heads/master/names.txt");
            await File.WriteAllTextAsync(inputPath, data);
        }
            
        var docs = (await File.ReadAllLinesAsync(inputPath)).Select(l => l.Trim()).Where(l => l.Length > 0).ToList();
        docs = docs.OrderBy(_ => Rng.Next()).ToList();
        Console.WriteLine($"num docs: {docs.Count}");

        var rawText = string.Join("", docs);
        var uchars = rawText.Distinct().OrderBy(c => c).ToList();
        _vocabSize = uchars.Count + 1;
        var bos = _vocabSize - 1;
        Console.WriteLine($"vocab size: {_vocabSize}");

        StateDict["wte"] = Matrix(_vocabSize, NEmbd);
        StateDict["wpe"] = Matrix(BlockSize, NEmbd);
        StateDict["lm_head"] = Matrix(_vocabSize, NEmbd);
            
        for (var i = 0; i < NLayer; i++)
        {
            StateDict[$"layer{i}.attn_wq"] = Matrix(NEmbd, NEmbd);
            StateDict[$"layer{i}.attn_wk"] = Matrix(NEmbd, NEmbd);
            StateDict[$"layer{i}.attn_wv"] = Matrix(NEmbd, NEmbd);
            StateDict[$"layer{i}.attn_wo"] = Matrix(NEmbd, NEmbd);
            StateDict[$"layer{i}.mlp_fc1"] = Matrix(4 * NEmbd, NEmbd);
            StateDict[$"layer{i}.mlp_fc2"] = Matrix(NEmbd, 4 * NEmbd);
        }
        Console.WriteLine($"num params: {AllParams.Count}");

        const double learningRate = 0.01;
        const double beta1 = 0.85;
        const double beta2 = 0.99;
        const double epsAdam = 1e-8;
        var m = new double[AllParams.Count];
        var v = new double[AllParams.Count];

        var numSteps = 1000;
            
        for (var step = 0; step < numSteps; step++)
        {
            var doc = docs[step % docs.Count];
            var tokens = new List<int> { bos };
            tokens.AddRange(doc.Select(c => uchars.IndexOf(c)));
            tokens.Add(bos);

            var n = Math.Min(BlockSize, tokens.Count - 1);

            var keys = new List<List<List<Value>>>();
            var values = new List<List<List<Value>>>();

            for (var l = 0; l < NLayer; l++) 
            {
                keys.Add([]);
                values.Add([]);
            }

            List<Value> losses = [];
            for (var posId = 0; posId < n; posId++)
            {
                var tokenId = tokens[posId];
                var targetId = tokens[posId + 1];

                var logits = Gpt(tokenId, posId, keys, values);
                var probs = Softmax(logits);
                    
                losses.Add(-probs[targetId].Log());
            }

            var loss = losses.Aggregate((a, b) => a + b) * (1.0 / n);

            foreach (var p in AllParams) p.Grad = 0;
            loss.Backward();

            var lrT = learningRate * (1.0 - (double)step / numSteps);
            for (var i = 0; i < AllParams.Count; i++)
            {
                var p = AllParams[i];
                m[i] = beta1 * m[i] + (1 - beta1) * p.Grad;
                v[i] = beta2 * v[i] + (1 - beta2) * (p.Grad * p.Grad);
                    
                var mHat = m[i] / (1 - Math.Pow(beta1, step + 1));
                var vHat = v[i] / (1 - Math.Pow(beta2, step + 1));
                    
                p.Data -= lrT * mHat / (Math.Sqrt(vHat) + epsAdam);
            }

            Console.WriteLine($"step {step + 1,4} / {numSteps} | loss {loss.Data:F4}");
        }

        Inference(bos, uchars);
    }

    private static void Inference(int bos, List<char> uchars)
    {
        Console.WriteLine("\n--- inference (hallucinated names) ---");
        var temperature = 0.5;
            
        for (var s = 0; s < 20; s++)
        {
            var keys = new List<List<List<Value>>>();
            var values = new List<List<List<Value>>>();

            for (var l = 0; l < NLayer; l++) 
            {
                keys.Add([]);
                values.Add([]);
            }

            var tokenId = bos;
            var result = "";

            for (var posId = 0; posId < BlockSize; posId++)
            {
                var logits = Gpt(tokenId, posId, keys, values);
                    
                var scaledLogits = logits.Select(l => l / temperature).ToList();
                var probs = Softmax(scaledLogits);
                    
                tokenId = WeightedSample(probs.Select(p => p.Data).ToList());
                    
                if (tokenId == bos) break;
                result += uchars[tokenId];
            }
            Console.WriteLine($"sample {s+1,2}: {result}");
        }
    }

    private static int WeightedSample(List<double> weights)
    {
        var total = weights.Sum();
        var r = Rng.NextDouble() * total;
        double sum = 0;
        for (var i = 0; i < weights.Count; i++)
        {
            sum += weights[i];
            if (r < sum) return i;
        }
        return weights.Count - 1;
    }
}