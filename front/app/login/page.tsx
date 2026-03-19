'use client'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button";
import { UserApi } from "@/lib/UserApi";
import { RsaLib } from "@/lib/Crypto/RsaLib";
import { useEffect, useState } from "react";
import { SwDb } from '../../lib/SwDatabase'
import { useRouter } from "next/navigation";
import { HomeHeader } from "@/components/HomeHeader";
import { JwtTokenLib } from "@/lib/JwtTokenLib";
import { toast } from "sonner";

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

  const [canShowPage, setCanShowPage] = useState<boolean>(false)

  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {

    const serverPublicKey = await UserApi.getApiPublicKey();
    const passwordCrypted = await RsaLib.textToCrypted(values.password, serverPublicKey)

    const login = await UserApi.login({
      username: values.username,
      password: passwordCrypted
    })

    if (login === undefined) {
      toast.error("The server is not responding")
      form.reset()
    } else if (!login.ok) {
      toast.error(login.message)
      form.reset()
    } else {
      await SwDb.saveJwtToken(login.token)
      router.push("/chat")
    }

  }

  useEffect(() => {
    (async () => {

      const jwtToken = await JwtTokenLib.isValidJwtToken()
      if (jwtToken) window.location.replace("/chat");
      else setCanShowPage(true)
      
    })();
  }, []);

  return (
    canShowPage && (
      <div className="flex flex-col pt-12 items-center h-[90vh] font-[family-name:var(--font-geist-sans)]">
        <HomeHeader title="Log in" />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Username" autoComplete="username" {...field} />
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
                    <Input type="password" autoComplete="password" placeholder="Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>

        <a href="https://github.com/YR72dpi/SecuredWhisker2.0" className="fixed bottom-5 flex gap-1">
          Secured Whisker <Image alt="new tab" src={'/icons/newTab.svg'} width={20} height={20} />
        </a>
      </div>
    )

  );
}
