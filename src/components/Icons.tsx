import Image from "next/image";

type IconProps = {
  src: any;
  size?: number;
  className?: string;
};

export default function Icon({ src, size = 20, className }: IconProps) {
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={className}
    />
  );
}
