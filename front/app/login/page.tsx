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

  const [loginError, setLoginError] = useState<string>("")


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

    const login = await UserApi.login({
      username: values.username,
      password: passwordCrypted
    })

    

    if (login === undefined) {
      setLoginError("Server error")
    } else if (!login.ok) {
      setLoginError(login.message)
    } else {
      await SwDb.saveJwtToken(login.token)
      setLoginError("ok")
    }
    

  }

  return (
    <div className="flex flex-col justify-center items-center h-screen font-[family-name:var(--font-geist-sans)]">
      <h1 className="mb-4 text-4xl font-extrabold">Secured Whisker</h1>
      <h2 className="mb-4 text-3xl">Log in</h2>
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

      {loginError !== "" && (
        <Alert variant="destructive" className="fixed bottom-[15px] w-[80%] bg-[#fff] z-10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {loginError}
          </AlertDescription>
        </Alert>
      )}

      <a href="https://github.com/YR72dpi/SecuredWhisker2.0" className="fixed bottom-5 flex gap-1">
        Secured Whisker <Image alt="new tab" src={'/icons/newTab.svg'} width={20} height={20} />
      </a>
    </div>
  );
}
