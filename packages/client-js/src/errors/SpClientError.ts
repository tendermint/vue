export default class SpVuexError extends Error {
	constructor(name:string, description:string) {
		super(description);
		Object.setPrototypeOf(this, new.target.prototype);
		this.name = name;
	}
}
