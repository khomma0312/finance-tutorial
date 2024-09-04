import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo.svg";

export const HeaderLogo = () => {
  return (
    <Link href="/">
      <div className="items-center hidden lg:flex">
        <Image src={logo} width={28} height={28} alt="Logo" />
        <p className="font-semibold text-white text-2xl ml-2.5">Finance</p>
      </div>
    </Link>
  );
};
