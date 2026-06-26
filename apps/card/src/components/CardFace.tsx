import type { ExecutiveProfile } from "../data/executives";

type CardFaceProps = {
  readonly executive: ExecutiveProfile;
};

export function CardFace({ executive }: CardFaceProps) {
  return (
    <div className="card-face" aria-label={`${executive.name} executive card identity`}>
      <div className="card-metal" aria-hidden="true" />
      <div className="card-spotlight" aria-hidden="true" />
      <div className="relative z-10 flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-heading text-xs font-semibold uppercase tracking-wider text-content-accent">
              BidayaX LLC
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-content-primary sm:text-5xl">
              {executive.name}
            </h1>
            <p className="mt-3 max-w-md font-heading text-base font-medium text-content-secondary">
              {executive.title}
            </p>
          </div>
          <div className="card-mark" aria-hidden="true">
            BX
          </div>
        </div>
        <div className="grid gap-3 text-sm text-content-secondary sm:grid-cols-2">
          <p>{executive.organization}</p>
          <p className="sm:text-right">
            {executive.address.street}
            <br />
            {executive.address.city}, {executive.address.region} {executive.address.postalCode}
          </p>
        </div>
      </div>
    </div>
  );
}
