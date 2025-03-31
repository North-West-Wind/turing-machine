import {ChangeEvent} from 'react';

interface Props {
	BoxChange: (value: string) => void;
}
  
export default function Login_box({ BoxChange }: Props) {
	function handleChange(event: ChangeEvent<HTMLInputElement>) {
		BoxChange(event.target.value);
	}

	// Signal a interrupt
	return <input type="text" onChange={handleChange} />;
}
// Change event means the input even change. It contains value
// onchange need a function. Its argument is function to change and return nothing
// This function is from outside, so use props with destructure
