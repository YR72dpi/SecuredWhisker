import { ChangeEvent, FC, FormEvent, useState } from "react";
import { Input } from "./ui/input";

interface Saved {
}

export const SendMessageForm: FC<Saved> = ({}) => {
    const [formData, setFormData] = useState({
        message: '',
      });
    
      const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
          ...formData,
          [name]: value,
        });
      };
    
      const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLElement
      };
      
    return (
        <form id="sendMessageForm" onSubmit={handleSubmit}>
          <Input 
              type="text" 
              name="message" 
              placeholder="Message" 
              value={formData.message} 
              onChange={handleChange} 
              />

          <Input className="hover:bg-slate-600" type="submit" value={"Send"} />
        </form>
    )
}