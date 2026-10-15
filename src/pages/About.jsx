import { Link } from 'react-router-dom'
import CopyButton from '../components/ui/CopyButton'
import PortraitFrame from '../components/media/PortraitFrame'
import { usePageMeta } from '../hooks/usePageMeta'

const SHORT_BIO =
  'Nyanchiew Malual is a journalist, storyteller, and podcast host. She reports on culture and community, and hosts a video podcast with honest, in-depth conversations. Her work gives people room to tell their own stories with care and dignity.'

export default function About() {
  usePageMeta({
    title: 'About & Press Kit',
    description: 'The story behind Nyanchiew Malual, plus a short bio for event organizers and media.',
  })

  return (
    <>
      <section className="page-hero">
        <div className="container split split--about">
          <div className="stack stack--lg">
            <p className="eyebrow">About Me</p>
            <h1>Every community has a heartbeat. My job is to listen—and help tell its story.</h1>
            <div className="stack">
              <p>I’m <strong style={{color: 'purple'}}>Nyanchiew Malual.</strong> I’m a journalist, storyteller, and podcast host.</p>
              <p>I believe the best stories start with listening. So I sit down with people, ask honest questions, and give them time to answer.</p>
              <p>My work covers investigations, culture, and personal essays. On my video podcast, I talk with guests about what matters to them.</p>
              <p>I also share everyday stories online and host events. If you have a story to tell, or an event that needs a host, let’s talk.</p>
            </div>
            <div className="row">
              <Link to="/book" className="btn btn--primary">
                Book Nyanchiew
              </Link>
              <Link to="/stories" className="btn btn--outline">
                Read my stories
              </Link>
            </div>
          </div>
          <PortraitFrame />
        </div>
      </section>

      <section className="section dark" aria-labelledby="press-title">
        <div className="container container--narrow stack stack--lg">
          <h2 id="press-title">Press bio</h2>
          <p className="muted">Introducing Nyanchiew at an event? Copy this bio and use it as it is.</p>
          <blockquote className="press-bio">{SHORT_BIO}</blockquote>
          <div>
            <CopyButton text={SHORT_BIO}>Copy Short Bio</CopyButton>
          </div>
        </div>
      </section>
    </>
  )
}
