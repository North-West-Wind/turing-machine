import {ChangeEvent} from 'react';
import '../../styles/textbox-decoration.css'

interface Props {
	BoxChange: (value: string) => void;
	default_holder: string;
	type: "text" | "password"
}
  
export default function LoginBox({ BoxChange, default_holder, type }: Props) {
	function handleChange(event: ChangeEvent<HTMLInputElement>) {
		BoxChange(event.target.value);
	}

	// Signal a interrupt
	return <input type={type} className='input-box' placeholder={default_holder} onChange={handleChange} /> ;
}
// Change event means the input even change. It contains value
// onchange need a function. Its argument is function to change and return nothing
// This function is from outside, so use props with destructure
