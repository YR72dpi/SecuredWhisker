"use client"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button";
import { SubscribeResponse, UserApi } from "@/lib/UserApi";
import { Crypto } from "@/lib/Crypto";
import { useState } from "react";
import { AlertCircle } from "lucide-react"
import { SwDb } from '../../lib/SwDatabase'

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { redirect, useRouter } from "next/navigation";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 5 characters.",
  }),
  password: z.string()
    .min(10, {
      message: "Password must be at least 10 characters.",
    })
})

export default function Home() {

  const [subscribeError, setSubscribeError] = useState<string>("")
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })


  async function onSubmit(values: z.infer<typeof formSchema>) {

    console.log(values)
    const serverPublicKey = await UserApi.getApiPublicKey();
    const passwordCrypted = await Crypto.textToCrypted(values.password, serverPublicKey)

    const generateRSAKeypair = await Crypto.generateRSAKeyPair()
    const userPublicKey = generateRSAKeypair.publicKey
    const userPrivateKey = generateRSAKeypair.privateKey
    console.log(userPublicKey)
    console.log(userPrivateKey)

    await SwDb.addPrivateKey(btoa(userPrivateKey))

    const subscribe: SubscribeResponse = await UserApi.subscribe({
      username: values.username,
      password: passwordCrypted,
      publicKey: btoa(userPublicKey)
    })

    if (subscribe === undefined) {
      setSubscribeError("Server error")
    } else if (!subscribe.ok) {
      setSubscribeError(subscribe.message)
    } else {
      setSubscribeError("")
      // router.push("/login")
    }

  }

  return (
    <div className="flex flex-col justify-center items-center h-screen font-[family-name:var(--font-geist-sans)]">
      <h1 className="mb-4 text-4xl font-extrabold">Secured Whisker</h1>
      <h2 className="mb-4 text-3xl">Signin</h2>
      <nav>
        <ul className="tw-nav">
          <li><a href="/">Home</a></li>
        </ul>
      </nav>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="username" {...field} />
                </FormControl>
                {/* <FormDescription>
                This is your public display name.
              </FormDescription> */}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input placeholder="password" {...field} />
                </FormControl>
                {/* <FormDescription>
                This is your public display name.
              </FormDescription> */}
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>

      {subscribeError !== "" && (
        <Alert variant="destructive" className="fixed bottom-[15px] w-[80%] bg-[#fff] z-10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {subscribeError}
          </AlertDescription>
        </Alert>
      )}

      <a href="https://github.com/YR72dpi/SecuredWhisker2.0" className="fixed bottom-5 flex gap-1">
        Secured Whisker <Image alt="new tab" src={'/icons/newTab.svg'} width={20} height={20} />
      </a>
    </div>
  );
}
