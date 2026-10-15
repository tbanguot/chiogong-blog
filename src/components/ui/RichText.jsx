import { Fragment } from 'react'

const URL_PATTERN = /(https?:\/\/[^\s<>()]*[^\s<>().,;:!?'"])/g

/** Text with clickable links. Never injects raw HTML. */
function linkify(text) {
  return text.split(URL_PATTERN).map((part, index) =>
    index % 2 ? (
      <a key={index} href={part} target="_blank" rel="noopener noreferrer">
        {part}
      </a>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  )
}

/**
 * Safe formatting for show notes and article bodies:
 * blank line = new paragraph · "## " = subheading · "- " lines = bullet list · links are clickable.
 */
export default function RichText({ text }) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/).map((block) => block.trim()).filter(Boolean)

  return (
    <div className="rich-text">
      {blocks.map((block, index) => {
        const lines = block.split('\n')
        if (block.startsWith('## ')) return <h3 key={index}>{block.slice(3)}</h3>
        if (lines.every((line) => line.startsWith('- '))) {
          return (
            <ul key={index}>
              {lines.map((line, i) => (
                <li key={i}>{linkify(line.slice(2))}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={index}>
            {lines.map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {linkify(line)}
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
