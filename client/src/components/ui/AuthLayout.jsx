import { IMG } from '@/pages/home/images';
import { photoProps } from '@/pages/home/motion';

const PHOTOS = {
  living: {
    id: IMG.living,
    alt: 'Bright living room with a sofa and tall windows',
  },
  evening: { id: IMG.evening, alt: 'House with warm lights on in the evening' },
  bedroom: { id: IMG.bedroom, alt: 'Made bed in a calm, light bedroom' },
};

// Shared frame for sign in, sign up and password pages: a home photo beside
// the form on wider screens, the form alone on phones.
const AuthLayout = ({ title, intro, photo = 'living', footer, children }) => {
  const { id, alt } = PHOTOS[photo];

  return (
    <div className="grid grow gap-12 px-4 pb-16 pt-28 md:grid-cols-2 md:px-0 md:pb-10 md:pt-20 lg:gap-20">
      <figure className="relative hidden overflow-hidden rounded-2xl bg-ink md:block md:h-[calc(100dvh-7.5rem)] md:max-h-[860px] md:min-h-[560px]">
        <img
          {...photoProps(id, 1600, '50vw')}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
        <figcaption className="absolute inset-x-0 bottom-0 p-8 text-white lg:p-10">
          <p className="text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
            Homes, considered.
          </p>
          <p className="mt-2 max-w-sm text-pretty text-white/85">
            Holiday homes in Kenya, booked directly with the owner.
          </p>
        </figcaption>
      </figure>

      <div className="flex flex-col md:justify-center md:py-10">
        <div className="w-full max-w-md md:mx-auto">
          <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight lg:text-[2.75rem]">
            {title}
          </h1>
          {intro && <div className="mt-3 text-pretty text-ink/70">{intro}</div>}
          <div className="mt-8">{children}</div>
          {footer && (
            <div className="mt-8 border-t border-ink/15 pt-6 text-sm text-ink/70">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const authLinkClass =
  'font-medium text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink';

export const FormError = ({ children }) =>
  children ? (
    <p
      role="alert"
      className="mb-5 rounded-xl border border-red-700/40 bg-red-50 p-3 text-sm text-red-800"
    >
      {children}
    </p>
  ) : null;

export default AuthLayout;
