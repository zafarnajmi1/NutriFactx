import CoverImage from "../common/CoverImage";
import BannerCarousel from "./BannerCarousel";

export default function BannerSection({ slides = [] }) {
  const firstImage = slides[0]?.featuredImage || "";

  return (
    <section className="relative overflow-hidden bg-nf-green text-white">
      <BannerCarousel slides={slides}>
        {firstImage ? (
          <CoverImage
            src={firstImage}
            alt=""
            priority
            sizes="100vw"
            className="pointer-events-none object-cover opacity-45"
          />
        ) : null}
      </BannerCarousel>
    </section>
  );
}
