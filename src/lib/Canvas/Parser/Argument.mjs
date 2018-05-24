export class Argument {

	constructor({ parent, name, required = false, custom, type = typeof custom === 'function' ? 'custom' : null, properties = new Map() }) {
		this.parent = parent;
		this.name = name;
		this.required = required;
		this.type = type;
		this.custom = custom;
		this.properties = new PropertyMap(this);
		for (const value of properties.values()) this.properties.set(value);
	}

}

export class PropertyMap extends Map {

	constructor(parent) {
		super();
		this.parent = parent;
	}

	set(value) {
		return super.set(value.name, new Argument({ parent: this.parent, ...value }));
	}

}
