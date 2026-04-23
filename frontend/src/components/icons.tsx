import Image from 'next/image';

interface LogoProps {
  className?: string;
}

const Logo = ({ className = "h-8 w-8" }: LogoProps) => {
  // Extract size from className (e.g., "h-8 w-8" -> 32px)
  const sizeMatch = className.match(/h-(\d+)/);
  const size = sizeMatch ? parseInt(sizeMatch[1]) * 4 : 32;
  
  return (
    <Image
      src="/logo.png"
      alt="Sahayak Logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
};

export const Icons = {
  logo: Logo,
};
