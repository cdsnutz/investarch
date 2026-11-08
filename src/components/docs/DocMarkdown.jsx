import ReactMarkdown from 'react-markdown';

const components = {
  h1: (props) => <h1 className="text-lg sm:text-xl font-semibold tracking-tight mt-6 first:mt-0 mb-2" {...props} />,
  h2: (props) => <h2 className="text-base font-semibold mt-6 mb-2 pb-1 border-b border-border" {...props} />,
  h3: (props) => <h3 className="text-sm font-semibold mt-4 mb-1" {...props} />,
  p: (props) => <p className="text-sm leading-relaxed my-2 break-words" {...props} />,
  ul: (props) => <ul className="list-disc pl-5 my-2 space-y-1 text-sm leading-relaxed" {...props} />,
  ol: (props) => <ol className="list-decimal pl-5 my-2 space-y-1 text-sm leading-relaxed" {...props} />,
  li: (props) => <li className="break-words" {...props} />,
  table: (props) => (
    <div className="overflow-x-auto my-3 -mx-1 px-1">
      <table className="w-full text-xs border-collapse" {...props} />
    </div>
  ),
  th: (props) => <th className="text-left font-semibold border-b border-border px-2 py-1.5 align-bottom" {...props} />,
  td: (props) => <td className="border-b border-border/60 px-2 py-1.5 align-top" {...props} />,
  code: (props) => <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded break-words" {...props} />,
  pre: (props) => <pre className="bg-muted rounded p-3 my-3 overflow-x-auto text-[11px] font-mono leading-relaxed" {...props} />,
  a: (props) => <a className="text-bottle underline underline-offset-2" {...props} />,
  hr: () => <hr className="my-5 border-border" />,
  blockquote: (props) => (
    <blockquote className="border-l-2 border-bottle/40 pl-3 my-3 text-sm text-muted-foreground" {...props} />
  )
};

export default function DocMarkdown({ text }) {
  return (
    <div>
      <ReactMarkdown components={components}>{text}</ReactMarkdown>
    </div>
  );
}