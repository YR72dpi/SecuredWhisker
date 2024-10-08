import { ScrollArea } from "./ui/scroll-area";
import { FC, MouseEvent } from "react";

interface Data {
  messages: string
  userSelected: (userSelected: string) => void,
  you: string
}

interface Message {
  toId: number
  from: { uniqId: string }
}

export const Contact: FC<Data> = ({ messages, userSelected, you }) => {
  let messageParsed: Message[] = JSON.parse(messages)

  let userList: string[] = []
  messageParsed.forEach(message => {
    if(!userList.includes(message.from.uniqId) && message.from.uniqId !== you) {
      userList.push(message.from.uniqId)
    }
  });

  let hasContact = userList.length > 0

  const userSelectingHandler = (evt: MouseEvent) => {
    let userButton = evt.target as HTMLElement
    document.querySelectorAll(".userButton").forEach((el) => {
      el.classList.add("border")
    })
    document.getElementById(userButton.id)!.classList.remove("border")

    let toUserInput = document.getElementById("toUser")! as HTMLInputElement
    toUserInput.value = userButton.innerText
    userSelected(userButton.innerText)
  }

  return (
    <>
      {hasContact ? (
        <ScrollArea className="h-[100%] w-[100%] rounded-md border p-4">
          <ul className="p-1 flex flex-col gap-2 overflow-auto" >
            {userList.map((user, index) => {
              return <li onClick={userSelectingHandler} key={user} id={"user+"+user} className="userButton px-2 py-1 rounded-lg border hover:bg-slate-600">{user}</li>
            })}
          </ul>
        </ScrollArea>
      ) : (
        <p className='p-3'>No contact</p>
      )}
    </>


  )
}