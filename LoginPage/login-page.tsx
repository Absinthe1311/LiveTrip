"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side with flower wreath image */}
      <div className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden">
        {/* Background image */}
        <Image
          src="/images/login-bg.png"
          alt="Flower wreath with sky view"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay text in the center - two lines stacked vertically */}
        <div className="relative z-10 text-center -mt-8 max-w-[280px] lg:max-w-[320px]">
          <p 
            className="text-4xl lg:text-5xl font-semibold tracking-wide leading-snug"
            style={{ 
              fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
              color: "#F5F5F5",
              textShadow: "0px 4px 12px rgba(139, 69, 19, 0.8), 0px 0px 20px rgba(0, 0, 0, 0.2)"
            }}
          >
            Live to see,
            <br />
            Live to go.
          </p>
        </div>
      </div>

      {/* Right side with login form */}
      <div className="flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            {/* LiveTrip Logo */}
            <div className="mb-6 flex justify-center">
              <Image
                src="/images/logo.png"
                alt="LiveTrip Logo"
                width={180}
                height={60}
                className="object-contain"
              />
            </div>
            <h2 className="text-xl text-gray-600">Welcome to LiveTrip</h2>
          </div>

          <form className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-gray-500" htmlFor="email">
                Users name or Email
              </label>
              <Input id="email" defaultValue="David Brooks" className="w-full p-2 border rounded" />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-500" htmlFor="password">
                Password
              </label>
              <Input id="password" type="password" defaultValue="password" className="w-full p-2 border rounded" />
              <div className="text-right">
                <Link href="#" className="text-sm text-gray-500 hover:text-gray-700">
                  Forget password?
                </Link>
              </div>
            </div>

            <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white">Sign in</Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <Button variant="outline" className="w-full border-gray-300">
              <Image src="/placeholder.svg" alt="Google" width={20} height={20} className="mr-2" />
              Sign in with Google
            </Button>

            <p className="text-center text-sm text-gray-500">
              New to LiveTrip?{" "}
              <Link href="#" className="text-gray-600 hover:text-gray-800">
                Create Account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
