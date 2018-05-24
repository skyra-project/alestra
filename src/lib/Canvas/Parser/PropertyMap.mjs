import Argument from './Argument';

export default class PropertyMap extends Map {

	constructor(parent) {
		super();
		this.parent = parent;
	}

	set(value) {
		return super.set(value.name, new Argument({ parent: this.parent, ...value }));
	}

}
