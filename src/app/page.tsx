import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const bgImage = PlaceHolderImages.find((img) => img.id === "inei-background");
const censistaGraphic = PlaceHolderImages.find((img) => img.id === "censista-graphic");

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center">
      {bgImage && (
        <Image
          src={bgImage.imageUrl}
          alt={bgImage.description}
          fill
          className="object-cover"
          data-ai-hint={bgImage.imageHint}
          priority
        />
      )}
      <div className="absolute inset-0 bg-accent/70 backdrop-blur-sm" />

      <div className="relative z-10 grid w-full max-w-screen-2xl grid-cols-1 items-center gap-8 px-4 md:grid-cols-2 md:px-8 lg:px-16">
        <div className="hidden h-full items-end justify-start md:flex">
          {censistaGraphic && (
            <div className="relative w-[400px] h-[600px]">
              <Image
                src={censistaGraphic.imageUrl}
                alt={censistaGraphic.description}
                fill
                className="object-contain"
                data-ai-hint={censistaGraphic.imageHint}
              />
            </div>
          )}
        </div>
        <div className="flex w-full items-center justify-center md:justify-start">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
