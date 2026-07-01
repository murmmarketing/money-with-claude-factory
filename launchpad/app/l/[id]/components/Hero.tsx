export default function Hero({
  headline,
  subhead,
  eyebrow,
  logo,
}: {
  headline: string;
  subhead?: string;
  eyebrow?: string;
  logo?: string;
}) {
  return (
    <header>
      {logo ? <img className="logo" src={logo} alt="" /> : null}
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h1 className="hero-title">{headline}</h1>
      {subhead ? <p className="hero-sub">{subhead}</p> : null}
    </header>
  );
}
