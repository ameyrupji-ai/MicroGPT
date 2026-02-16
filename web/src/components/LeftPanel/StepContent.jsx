import styles from './StepContent.module.css';

function renderSpans(spans) {
  return spans.map((span, i) => {
    if (span.color) {
      return (
        <span key={i} className={styles.tensorRef} style={{ color: span.color, borderColor: span.color + '40' }}>
          {span.text}
        </span>
      );
    }
    return <span key={i}>{span.text}</span>;
  });
}

export default function StepContent({ step }) {
  return (
    <div className={styles.content}>
      {step.content.map((node, i) => {
        switch (node.type) {
          case 'h2':
            return <h2 key={i} className={styles.heading}>{node.text}</h2>;

          case 'p':
            if (node.spans) {
              return <p key={i} className={styles.paragraph}>{renderSpans(node.spans)}</p>;
            }
            return <p key={i} className={styles.paragraph}>{node.text}</p>;

          case 'code':
            return (
              <pre key={i} className={styles.codeBlock}>
                <code>{node.text}</code>
              </pre>
            );

          case 'quote':
            return (
              <blockquote key={i} className={styles.quote}>
                {node.text}
              </blockquote>
            );

          case 'stats':
            return (
              <div key={i} className={styles.statsGrid}>
                {node.items.map((item, j) => (
                  <div key={j} className={styles.stat}>
                    <div className={styles.statValue}>{item.value}</div>
                    <div className={styles.statLabel}>{item.label}</div>
                  </div>
                ))}
              </div>
            );

          case 'press_space':
            return (
              <div key={i} className={styles.pressSpace}>
                Press Space to continue
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
