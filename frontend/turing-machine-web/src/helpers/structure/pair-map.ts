export class PairMap<A, B, V> {
	private aMap = new Map<A, Map<B, V>>;
	private bMap = new Map<B, Map<A, V>>;
	private aPair = new Map<A, Set<B>>;
	private bPair = new Map<B, Set<A>>;

	set(a: A, b: B, v: V) {
		if (this.aMap.has(a)) this.aMap.get(a)!.set(b, v);
		else this.aMap.set(a, new Map([[b, v]]));
		if (this.bMap.has(b)) this.bMap.get(b)!.set(a, v);
		else this.bMap.set(b, new Map([[a, v]]));
		if (this.aPair.has(a)) this.aPair.get(a)!.add(b);
		else this.aPair.set(a, new Set([b]));
		if (this.bPair.has(b)) this.bPair.get(b)!.add(a);
		else this.bPair.set(b, new Set([a]));
	}

	get(a: A, b: B) {
		return this.aMap.get(a)?.get(b);
	}

	getA(a: A) {
		return this.aMap.get(a);
	}

	getB(b: B) {
		return this.bMap.get(b);
	}

	has(a: A, b: B) {
		return !!this.aMap.get(a)?.has(b);
	}

	delete(a: A, b: B) {
		const d1 = this.aMap.get(a)?.delete(b);
		const d2 = this.bMap.get(b)?.delete(a);
		const d3 = this.aPair.get(a)?.delete(b);
		const d4 = this.bPair.get(b)?.delete(a);
		return d1 && d2 && d3 && d4;
	}

	deleteA(a: A) {
		if (!this.aMap.has(a)) return false;
		for (const b of this.aPair.get(a)!) {
			const d1 = this.bMap.get(b)?.delete(a);
			const d2 = this.bPair.get(b)?.delete(a);
			if (!d1 || !d2) return false;
		}
		return this.aMap.delete(a) &&	this.aPair.delete(a);
	}

	deleteB(b: B) {
		if (!this.bMap.has(b)) return false;
		for (const a of this.bPair.get(b)!) {
			const d1 = this.aMap.get(a)?.delete(b);
			const d2 = this.aPair.get(a)?.delete(b);
			if (!d1 || !d2) return false;
		}
		return this.bMap.delete(b) &&	this.bPair.delete(b);
	}

	forEach(cb: (v: V, a: A, b: B) => any) {
		this.aMap.forEach((map, a) => map.forEach((v, b) => cb(v, a, b)));
	}
}