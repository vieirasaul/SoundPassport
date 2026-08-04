import Image from "next/image";

export function BrandLogo() {
  return (
    <span className="inline-flex items-center gap-2.5" aria-hidden="true">
      <Image
        src="/favicon.svg"
        alt=""
        width={56}
        height={56}
        priority
        className="size-14 shrink-0"
      />

      <span className="text-[15px] font-bold uppercase tracking-[0.08em] sm:text-base">
        <span className="text-[#112A42]">Sound</span>
        <span className="ml-[0.08em] text-[#A77818]">Passport</span>
      </span>
    </span>
  );
}
