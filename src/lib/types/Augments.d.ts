declare module 'discord.js' {
	interface MessageExtendablesAskOptions {
		time?: number;
		max?: number;
	}

	interface Message {
		prompt(content: string, time?: number): Promise<Message>;
		ask(options?: MessageOptions, promptOptions?: MessageExtendablesAskOptions): Promise<boolean>;
		ask(content: string, options?: MessageOptions, promptOptions?: MessageExtendablesAskOptions): Promise<boolean>;
		alert(content: string, timer?: number): Promise<Message>;
		alert(content: string, options?: number | MessageOptions, timer?: number): Promise<Message>;
		nuke(time?: number): Promise<Message>;
	}

}
