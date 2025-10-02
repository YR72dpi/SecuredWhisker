"use client"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button";
import { SubscribeResponse, UserApi } from "@/lib/UserApi";
import { RsaLib } from "@/lib/RsaLib";
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react"
import { SwDb } from '../../lib/SwDatabase'

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { useRouter } from "next/navigation";
import { HomeHeader } from "@/components/HomeHeader";
import { API_PROTOCOL } from "@/lib/NetworkProtocol";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(10, {
    message: "Password must be at least 10 characters.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export default function Home() {

  const [subscribeError, setSubscribeError] = useState<string>("")
  const [pendingValues, setPendingValues] = useState<z.infer<typeof formSchema> | null>(null)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => setPendingValues(values)

  useEffect(() => {
    if (!pendingValues) return;

    const doSubmit = async () => {
      const serverPublicKey = await UserApi.getApiPublicKey();
      const passwordCrypted = await RsaLib.textToCrypted(pendingValues.password, serverPublicKey)

      const generateRSAKeypair = await RsaLib.generateRSAKeyPair()
      const userPublicKey = generateRSAKeypair.publicKey
      const userPrivateKey = generateRSAKeypair.privateKey

      await SwDb.addPrivateKey(btoa(userPrivateKey))

      const subscribe: SubscribeResponse = await UserApi.subscribe({
        username: pendingValues.username,
        password: passwordCrypted,
        publicKey: btoa(userPublicKey)
      })

      if (subscribe === undefined) {
        setSubscribeError("Server error")
      } else if (!subscribe.ok) {
        setSubscribeError(subscribe.message)
      } else {
        setSubscribeError("")
        router.push("/login")
      }
      setPendingValues(null)
    }

    doSubmit()
  }, [pendingValues, router])

  useEffect(() => {
    (async () => {
      const jwtToken = await SwDb.getJwtToken();
      if (!jwtToken) return;

      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + jwtToken);

      const requestOptions: RequestInit = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/selfUserData", requestOptions)
        .then((response) => {
          if (response.ok) window.location.replace("/chat");
        })
        .catch(() => { });
    })();
  }, []);

  return (
    <div className="flex flex-col pt-12 items-center h-[90vh] font-[family-name:var(--font-geist-sans)]">
      <HomeHeader title="Sign in" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Username" {...field} />
                </FormControl>
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
                  <Input type="password" placeholder="Password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Confirm password" {...field} />
                </FormControl>
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
