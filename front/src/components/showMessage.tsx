import { ScrollArea } from "@radix-ui/react-scroll-area";
import { FC } from "react";

interface Data {
  messages: string
  from: string,
  you: string
}

interface Message {
  toId: number
  from: {
    uniqId: string
  }
  content: string
}

export const ShowMessage: FC<Data> = ({
  messages,
  from,
  you
}) => {
  let messageParsed: Message[] = JSON.parse(messages)
  console.log(messageParsed)
  let messagesFromSelectedUser = messageParsed.filter((message) => message.from.uniqId)

  return (


    <ScrollArea className="h-[100%] w-[100%] rounded-md border p-4">
      {messagesFromSelectedUser.map((user) => {
        return <p><strong>{user.from.uniqId === you ? "You" : user.from.uniqId } : </strong>{user.content}</p>

        // return <li onClick={userSelectingHandler} key={index} id={"user+" + user} className="userButton px-2 py-1 rounded-lg border hover:bg-slate-600">{user}</li>
      })}



    </ScrollArea>
  )
}