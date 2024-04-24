import JSEncrypt from "jsencrypt";
import { ScrollArea } from "./ui/scroll-area";
import { FC } from "react";

interface Data {
  messages: string
  you: string,
  privateKey: string,
  selectedUser: string
}

interface Message {
  toId: number
  from: { uniqId: string }
  content: string
}

export const ShowMessage: FC<Data> = ({
  messages,
  you,
  privateKey,
  selectedUser
}) => {
  const decryptMessage = (messageContent: Message[]) => {
    let decryptedMessage: Message[] = []
    messageContent.forEach(async messageData => {

      // Créez une instance de JSRSA
    var rsaDecrypt = new JSEncrypt();

    rsaDecrypt.setPrivateKey(privateKey);

    var decrypted = rsaDecrypt.decrypt(messageData.content);

    if(decrypted) {
      decryptedMessage.push({
        toId: messageData.toId,
          from : { uniqId : messageData.from.uniqId },
          content : decrypted
      })
    }

    })

    return decryptedMessage;
  }
  
  let messageParsed: Message[] = JSON.parse(messages)
  let messagesFromSelectedUser: Message[] = messageParsed.filter((message) => message.from.uniqId === selectedUser)
  let decryptedMessages: Message[] = decryptMessage(messagesFromSelectedUser)

  return (

    <ScrollArea className="h-[100%] w-[100%] rounded-md border flex flex-col-reverse column p-4">
      {decryptedMessages.map((user, index) => {
        return <p key={user + String(index)}>
          <strong>{user.from.uniqId === you ? "You" : user.from.uniqId} : </strong>
          {user.content}
        </p>
      })}
    </ScrollArea>
  )
}