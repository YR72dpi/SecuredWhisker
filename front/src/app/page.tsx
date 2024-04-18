import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <>
      <main>
        <form id="registerForm">
          <Input type="text" name="ip" placeholder="ip" />
          <Input type="text" name="port" placeholder="port" />
          <Input type="text" name="username" placeholder="username" />
          <Input type="submit" value={"Register"} />
        </form>
      </main>
    </>
  );
}
