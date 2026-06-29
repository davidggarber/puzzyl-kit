//#region src/dragDrop.ts
function e(e) {
	return {
		x: parseInt(e.style.left),
		y: parseInt(e.style.top)
	};
}
function t() {
	let e = document.getElementsByClassName("moveable");
	for (let t = 0; t < e.length; t++) r(e[t]);
	e = document.getElementsByClassName("drop-target");
	for (let t = 0; t < e.length; t++) i(e[t]);
	e = document.getElementsByClassName("free-drop");
	for (let t = 0; t < e.length; t++) {
		let n = e[t];
		a(n), q(n, "z-grow-up") ? n.setAttributeNS("", "data-z-grow", "up") : q(n, "z-grow-down") && n.setAttributeNS("", "data-z-grow", "down"), o(n);
	}
}
function n(e) {
	let t = Iu("moveable", void 0, e);
	for (let e = 0; e < t.length; e++) r(t[e]);
	t = Iu("drop-target", void 0, e);
	for (let e = 0; e < t.length; e++) i(t[e]);
	t = Iu("free-drop", void 0, e);
	for (let e = 0; e < t.length; e++) {
		let n = t[e];
		a(n), q(n, "z-grow-up") ? n.setAttributeNS("", "data-z-grow", "up") : q(n, "z-grow-down") && n.setAttributeNS("", "data-z-grow", "down"), o(n);
	}
}
function r(e) {
	e.namespaceURI != "http://www.w3.org/1999/xhtml" && console.error("WARNING: non-HTML elements are not draggable: " + e.localName), e.setAttribute("draggable", "true"), e.onpointerdown = function(e) {
		ee(e);
	}, e.ondrag = function(e) {
		re(e);
	}, e.ondragend = function(e) {
		ne(e);
	};
}
function i(e) {
	e.onpointerup = function(e) {
		te(e);
	}, e.ondragenter = function(e) {
		ae(e);
	}, e.ondragover = function(e) {
		ae(e);
	}, e.onpointermove = function(e) {
		ie(e);
	};
}
function a(e) {
	e.onpointerdown = function(e) {
		p(e);
	}, e.ondragenter = function(e) {
		ae(e);
	}, e.ondragover = function(e) {
		ae(e);
	};
}
function o(e) {
	let t = e.getAttributeNS("", "data-z-grow")?.toLowerCase();
	if (!t || t != "up" && t != "down") return;
	let n = t == "up", r = e.getBoundingClientRect().height, i = e.getElementsByClassName("moveable");
	for (let e = 0; e < i.length; e++) {
		let t = i[e], a = parseInt(t.style.top);
		a = 1e3 + (n ? r - a : a), t.style.zIndex = String(a);
	}
}
var s = null, c = null, l = null, u = null;
function d(e) {
	s = c, c != null && c != e && (K(c, "drag-selected", !1), c = null), e != null && e != c && (c = e, K(c, "displaced", !1), K(c, "placed", !1), K(c, "drag-selected", !0));
}
function f(e) {
	if (!c) return;
	let t = h();
	if (e === t) {
		if (s !== c) return;
		e = null;
	}
	let n = null;
	if (e != null && (n = ku(e, "moveable", void 0, 0), n != null && e.removeChild(n), t?.removeChild(c), e.appendChild(c), ia(c, e)), K(c, "placed", !0), K(c, "drag-selected", !1), c = null, u = null, l != null && (K(l, "drop-hover", !1), l = null), n != null) {
		if (K(n, "placed", !1), K(n, "displaced", !0), !q(t, "drag-source")) {
			let e = oe();
			e != null && (t = e);
		}
		t?.appendChild(n), ia(n, t);
	}
}
function p(e) {
	if (!(u == null || e.clientX == u.x && e.clientY == u.y && s == null) && c != null) {
		let t = e.clientX - u.x, n = e.clientY - u.y, r = parseInt(c.style.left), i = parseInt(c.style.top);
		c.style.left = r + t + "px", c.style.top = i + n + "px", m(c, i + n), aa(c), f(null);
	}
}
function m(e, t) {
	let n = Z(e, "free-drop"), r = n?.getAttributeNS("", "data-z-grow")?.toLowerCase();
	if (r == "down") e.style.zIndex = String(1e3 + t);
	else if (r == "up") {
		let r = n.getBoundingClientRect();
		e.style.zIndex = String(1e3 + r.height - t);
	}
}
function h() {
	if (c != null) {
		let e = Z(c, "drop-target");
		return e ??= Z(c, "drag-source"), e ??= Z(c, "free-drop"), e;
	}
	return null;
}
function ee(e) {
	let t = e.target;
	if (!t || t.tagName == "INPUT") return;
	let n = Z(t, "moveable");
	n != null && (c == null ? (d(n), u = {
		x: e.clientX,
		y: e.clientY
	}) : n == c && (s = n));
}
function te(e) {
	let t = e.target;
	if (!(!t || t.tagName == "INPUT") && c != null) {
		let n = Z(t, "drop-target");
		if (e.pointerType == "touch") {
			let t = document.elementFromPoint(e.clientX, e.clientY);
			t && (t = Z(t, "drop-target"), t && (n = t));
		}
		f(n);
	}
}
function ne(e) {
	let t = document.elementFromPoint(e.clientX, e.clientY), n = Z(t, "drop-target");
	n ? f(n) : (n = Z(t, "free-drop"), n && p(e));
}
function re(e) {
	if (e.screenX == 0 && e.screenY == 0) return;
	let t = Z(document.elementFromPoint(e.clientX, e.clientY), "drop-target");
	t != l && (K(l, "drop-hover", !1), t != h() && (K(t, "drop-hover", !0), l = t));
}
function ie(e) {
	e.pointerType == "touch" && (console.log("touch-drag to " + e.x + "," + e.y), re(e));
}
function ae(e) {
	let t = document.elementFromPoint(e.clientX, e.clientY), n = Z(t, "drop-target");
	n ??= Z(t, "free-drop"), c != null && n != null && e.preventDefault();
}
function oe() {
	let e = document.getElementsByClassName("drag-source");
	for (let t = 0; t < e.length; t++) if (ku(e[t], "moveable", void 0, 0) == null) return e[t];
	return null;
}
function se(e, t) {
	e != null && t != null && !Du(e, t) && (d(e), f(t));
}
function ce(e, t) {
	e != null && t != null && (e.style.left = t.x + "px", e.style.top = t.y + "px", m(e, t.y), K(e, "placed", !0));
}
//#endregion
//#region src/contextError.ts
var g = class extends Error {
	constructor(e, t, n) {
		super(e), this.name = "ContextError", n instanceof Error ? this.cause = n : n === void 0 ? this.cause = void 0 : this.cause = Error(String(n)), this.functionStack = [], this.sourceStack = [], this.callStack = "", t && (typeof t == "function" ? this.sourceStack.push(t()) : this.sourceStack.push(t));
	}
	_cacheCallstack() {
		this.callStack === "" && (this.callStack = this.cause ? this.cause.stack : this.stack, this.callStack?.substring(0, this.message.length) == this.message && (this.callStack = this.callStack.substring(this.message.length)));
	}
};
function le(e) {
	return e instanceof Error && e.name === "ContextError";
}
function _(e, t, n) {
	let r;
	return r = le(e) ? e : e instanceof Error ? new g(e.name + ": " + e.message, void 0, e) : new g(String(e)), r.callStack === "" && (r.callStack = r.cause ? r.cause.stack : r.stack, r.callStack?.substring(0, r.message.length) == r.message && (r.callStack = r.callStack.substring(r.message.length))), t && r.functionStack.push(t), n && (typeof n == "function" && (n = n()), r.sourceStack.push(n)), ue(r), r;
}
function ue(e) {
	let t = "ContextError: " + e.message;
	if (e.sourceStack.length > 0) for (let n = 0; n < e.sourceStack.length; n++) {
		let r = e.sourceStack[n];
		t += "\n" + r.source, r.offset !== void 0 && (t += "\n" + Array(r.offset + 1).join(" ") + "^", r.length && r.length > 1 && (t += Array(r.length).join("^")));
	}
	e.callStack && (t += "\n" + e.callStack), e.cause && (t += "\nCaused by: " + e.cause), e.stack = t;
}
function de(e) {
	return e.nodeType == Node.ELEMENT_NODE ? v(e) : {
		source: e.nodeValue || "",
		offset: 0,
		length: 1
	};
}
function v(e, t) {
	let n = "<" + e.localName, r = 0, i = 0;
	for (let a = 0; a < e.attributes.length; a++) {
		let o = e.attributes[a].name, s = e.attributes[a].value;
		o === t && (r = n.length + o.length + 3, i = s.length), n += " " + e.attributes[a].name + "=\"" + e.attributes[a].value + "\"";
	}
	return t && r == 0 && (r = 1, i = e.localName.length), e.childNodes.length == 0 && (n += " /"), n += ">", r == 0 && (i = n.length), {
		source: n,
		offset: r,
		length: i
	};
}
function y(e, t) {
	return () => v(e, t);
}
var fe = class extends Error {
	constructor(e) {
		super(e), this.name = "CodeError";
	}
};
function pe(e, t = !1) {
	let n = "<" + e.localName;
	for (let r = 0; r < e.attributes.length; r++) {
		let i = e.attributes[r].value;
		if (t) try {
			i = Ve(De(i));
		} catch {
			i = "#ERROR#";
		}
		n += " " + e.attributes[r].name + "=\"" + i + "\"";
	}
	return e.childNodes.length == 0 && (n += " /"), n += ">", n;
}
function me(e, t, n) {
	let r = pe(e), i;
	try {
		i = De(r), typeof i != "string" && (i = JSON.stringify(i));
	} catch (e) {
		i = e instanceof Error ? e.name + ": " + e.message : "Exception: " + e;
	}
	let a = gu(r + "âžŸ" + i);
	if (Array.isArray(t) ? G(t, a) : a.length > 0 && t.appendChild(a[0]), n) {
		let n = pe(e, !0);
		if (n !== r) {
			let e = gu(n);
			Array.isArray(t) ? G(t, a) : e.length > 0 && t.appendChild(e[0]);
		}
	}
}
//#endregion
//#region src/builderContext.ts
function he() {
	return W().lookup || {};
}
var ge = [];
function _e() {
	return ge.length == 0 && ge.push(he()), ge[ge.length - 1];
}
function ve(e) {
	W().lookup = e, ge.splice(0, ge.length);
}
function ye(e) {
	return e === void 0 && (e = structuredClone(_e())), ge.push(e), _e();
}
function be() {
	return ge.pop(), _e();
}
function xe(e, t) {
	return wt(_e(), e, void 0, t);
}
function Se(e, t) {
	if (e) return wt(he(), e, void 0, t);
}
function Ce(e, t) {
	for (let n = 0; n < e.attributes.length; n++) {
		let r = du(e.attributes[n].name), i = e.attributes[n].value;
		try {
			if (i = Ee(i, !1), r == "id") t.id = i;
			else if (r == "class") {
				if (i) {
					let e = i.split(" ");
					for (let n = 0; n < e.length; n++) e[n].length > 0 && t.classList.add(e[n]);
				}
			} else r == "xmlns" || t.setAttributeNS("", r, i);
		} catch (t) {
			throw _(t, "cloneAttributes", v(e, r));
		}
	}
}
function we(e, t, n) {
	for (let r = 0; r < n.length; r++) {
		let i = n[r];
		try {
			let n = e.getAttributeNS("", i);
			n != null && (n = Ee(n, !1), t.setAttributeNS("", i, n));
		} catch (t) {
			throw _(t, "cloneAttributes", v(e, i));
		}
	}
}
function Te(e) {
	let t = e.textContent || "", n = nu();
	if (n === tu.pre) {
		let n = ("" + De(t, tu.off)).split("\n").map((e) => Oe(e));
		X(e.parentElement, "pre") && (e.parentNode?.childNodes[0] === e && n[0] === "" && n.splice(0, 1), e.parentNode?.childNodes[e.parentNode?.childNodes.length - 1] === e && n.length > 0 && n[n.length - 1] === "" && n.splice(n.length - 1, 1));
		let r = n.join("\n");
		return [document.createTextNode(r)];
	}
	let r = De(t, n);
	return r === "" ? [] : [document.createTextNode(r)];
}
function Ee(e, t) {
	if (e === null) return "";
	let n = t ? nu() : tu.off;
	return "" + De(e, Math.max(n, tu.on));
}
function De(e, t = tu.off) {
	if (e === null) return "";
	t != tu.off && (e = Oe(e));
	let n = xt(e), r = "";
	for (let e = 0; e < n.length; e++) if (!n[e].formula) t == tu.all ? r += Oe(n[e].text) : r += n[e].text;
	else try {
		let t = Le(n[e].text);
		if (e == 0 && n.length == 1) return t;
		r += Ve(t, n[e]);
	} catch (t) {
		throw _(t, "complexAttribute", n[e]);
	}
	return r;
}
function Oe(e) {
	let t = 0, n = e.length;
	for (; t < n && (e.charCodeAt(t) || 33) <= 32;) t++;
	for (; --n > t && (e.charCodeAt(n) || 33) <= 32;);
	return e.substring(t, n + 1);
}
function ke(e) {
	let t = [], n = [], r = {
		text: "",
		type: 0,
		source: e,
		offset: 0,
		length: 0
	}, i = !1, a = e.length;
	for (let o = 0; o <= e.length; o++) {
		let s = o < e.length ? e[o] : "";
		if (s == "`") {
			if (!i) {
				i = !0;
				continue;
			}
			i = !1;
		}
		let c = S(s);
		if (n.length > 0 && !i && s == n[n.length - 1]) n.pop(), r.type != 0 && t.push(r), t.push(r = {
			text: s,
			type: 32,
			source: e,
			offset: o,
			length: 1
		}), r = {
			text: "",
			type: 0,
			source: e,
			offset: o + 1,
			length: 0
		};
		else if (!ze(n) && !i && (ft(c) || pt(c))) {
			let i = ft(c) ? 16 : 32;
			r.type != 0 && t.push(r), t.push(r = {
				text: s,
				type: i,
				source: e,
				offset: o,
				length: 1
			}), i == 16 && n.push(c.closeChar), r = {
				text: "",
				type: 0,
				source: e,
				offset: o + 1,
				length: 0
			};
		} else if (!ze(n) && !i && c !== null) {
			let n = 0;
			dt(c) && (n |= 2), ut(c) && (n |= 1), r.type != 0 && t.push(r), t.push(r = {
				text: s,
				type: n,
				source: e,
				offset: o,
				length: 1
			}), r = {
				text: "",
				type: 0,
				source: e,
				offset: o + 1,
				length: 0
			};
		} else i && c == null && (r.text += "`"), r.text += s, r.text !== "" && (r.type = 3840, r.length = Math.min(o + 1, a) - r.offset);
		i = !1;
	}
	r.type != 0 && t.push(r);
	let o = 0;
	for (let e = 0; e < t.length; e++) {
		let n = t[e];
		if (n.source == null || n.offset == null || n.length == null) throw new fe("All tokens should know their source offset: " + n);
		n.type & 3 ? o & 800 ? n.type & 3 && (n.type = 2, n.text = S(n.text).binaryChar ?? n.text) : (n.type = 1, n.text = S(n.text).unaryChar ?? n.text) : n.type & 3840 && (Oe(n.text).length == 0 ? n.type = 1024 : Me(n.text) ? n.type = 512 : n.type = 256), n.type != 1024 && (o = n.type);
	}
	return t;
}
function Ae(e, t) {
	let n = [e[t]];
	for (let r = t + 1; r < e.length; r++) {
		let t = e[r];
		if (t.type == 32) if (t.text == Re[n[n.length - 1].text]) {
			if (n.pop(), n.length == 0) return r;
		} else throw new g("Unmatched close bracket", t);
		else t.type == 16 && n.push(t);
	}
	throw new g("Missing close " + (mt(n[n.length - 1].text) ? "quotes" : "brackets"), n[n.length - 1]);
}
var je = class {
	constructor(e, t, n, r) {
		this.bracket = "", this.left = n, this.right = t, this.value = e, this.span = r || e, t && (t.parent = this), n && (n.parent = this);
	}
	toString() {
		let e = this.bracket === "" ? "" : Re[this.bracket];
		return this.left ? this.bracket + this.left.toString() + " " + this.value.text + " " + this.right?.toString() + e : this.right ? this.bracket + this.value.text + " " + this.right?.toString() + e : this.bracket + this.value.text + e;
	}
	isSimple() {
		return !this.left && !this.right;
	}
	reRootContext() {
		return this.bracket == "[" || this.bracket == "{";
	}
	evaluate(e) {
		let t;
		if (this.left) try {
			let e = S(this.value.text), n = e.binaryOp, r = this.left.evaluate(e.evalLeft), i = this.right.evaluate(e.evalRight || this.right.reRootContext());
			if (!n) throw new g("Unrecognize binary operator", this.value);
			if (t = n(r, i, this.left?.span, this.right?.span), tl() && el() && console.log(this.toString() + " => " + t), t === void 0 || Number.isNaN(t)) throw new g("Operation " + e?.raw + " resulted in " + t + " : " + r + e?.raw + i, this.value);
		} catch (e) {
			throw _(e, "evaluate:binary", this.span);
		}
		else if (this.right) try {
			let e = S(this.value.text), n = e.unaryOp, r = this.right.evaluate(e.evalRight);
			if (!n) throw new g("Unrecognize unary operator", this.value);
			if (t = n(r, this.right?.span), tl() && el() && console.log(this.toString() + " => " + t), t === void 0 || Number.isNaN(t)) throw new g("Operation " + e?.raw + " resulted in " + t + " : " + e?.raw + r, this.value);
		} catch (e) {
			throw _(e, "evaluate:unary", this.span);
		}
		else if (this.bracket === "\"" || this.bracket === "'") t = _t(this.value.text);
		else {
			t = _t(this.value.text);
			let n = Oe(t);
			if (e === !0) {
				let e = _e();
				if (n in e) t = e[n], t = _t(t);
				else if (Me(n)) t = parseInt(n);
				else if (this.bracket == "{") throw new g("Name lookup failed", this.span);
			}
		}
		return tl() && el() && console.log(this.value + " => " + t), t;
	}
};
function Me(e) {
	return /^\s*-?\d+\s*$/.test(e);
}
function Ne(e) {
	let t = -1, n = -1;
	for (let r = 0; r < e.length; r++) {
		let i = e[r];
		if (i.type & 255) {
			let e = S(i.text ?? "");
			e && (e.precedence || 0) > t && (t = e.precedence, n = r);
		}
	}
	return n;
}
function Pe(e, t, n) {
	let r = Math.min(e.offset, t.offset), i = Math.max(e.offset + e.length, t.offset + t.length);
	return {
		type: n ? 4096 : 256,
		node: n,
		source: e.source,
		text: bt(e.source.substring(r, i)),
		offset: r,
		length: i - r
	};
}
function Fe(e) {
	return {
		type: 1024,
		source: e.source,
		text: "",
		offset: e.offset + e.length,
		length: 0
	};
}
function Ie(e, t) {
	if (e.length == 0 && !t) throw new fe("Cannot treeify without content");
	let n = e.length > 0 ? Pe(e[0], e[e.length - 1]) : Fe(t);
	if (t && mt(t.text)) return new je(n);
	for (; e.length > 0;) {
		let n = Ne(e);
		if (n < 0) {
			let n;
			for (let r = 0; r < e.length; r++) {
				let i = e[r];
				if (i.type != 1024) {
					if (n) throw new g("Consecutive tokens with no operator", i);
					i.type == 4096 ? n = i.node : (n = new je(i), t && (n.bracket = t.text));
				}
			}
			if (!n) throw new g("No value tokens in span", Pe(e[0], e[e.length - 1]));
			return n;
		}
		let r = e[n], i = r.text, a = S(i);
		if (ut(a)) {
			let t = n + 1;
			for (; t < e.length && e[t].type == 1024;) t++;
			if (t >= e.length) throw new g("Unary operator without following operand", r);
			let i = e.splice(n + 1, t - n), a = new je(r, Ie(i)), o = Pe(r, i[i.length - 1], a);
			a.span = o, e[n] = o;
		} else if (dt(a)) {
			let t = n + 1;
			for (; t < e.length && e[t].type == 1024;) t++;
			if (t >= e.length) throw new g("Binary operator without right operand", r);
			let i = e.splice(n + 1, t - n), a = Ie(i), o = n - 1;
			for (; o >= 0 && e[o].type == 1024;) o--;
			if (o < 0) throw new g("Binary operator without left operand", r);
			let s = e.splice(o, n - o), c = new je(r, a, Ie(s)), l = Pe(s[0], i[i.length - 1], c);
			c.span = l, e[o] = l;
		} else if (ft(a)) {
			let t = Ae(e, n), i = e.splice(t, 1)[0], o = Ie(e.splice(n + 1, t - n - 1), r);
			o.bracket = a.raw;
			let s = Pe(r, i, o);
			o.span = s, e[n] = s;
		} else throw new g("Unknown operator " + i, r);
	}
	throw n.length == 0 ? new g("Empty brackets yield no value", t) : new g("Treeify reduced to an empty span", n);
}
function Le(e) {
	if (e === null) return "";
	try {
		return Ie(ke(e)).evaluate(!0);
	} catch (e) {
		throw _(e, "evaluateFormula");
	}
}
function b(e, t, n, r, i) {
	let a = e.getAttributeNS("", t);
	if (!a) {
		if (r === !1) return a == "" ? "" : void 0;
		throw new g("Missing required attribute: " + t, v(e));
	}
	try {
		return n ? Le(a) : De(a);
	} catch (n) {
		if (i !== void 0) return i;
		throw _(n, void 0, v(e, t));
	}
}
var Re = {
	"(": ")",
	"[": "]",
	"{": "}",
	"\"": "\"",
	"'": "'"
};
function ze(e) {
	return e.length > 0 && (e[e.length - 1] == "\"" || e[e.length - 1] == "'");
}
function x(e, t) {
	let n = parseFloat(e);
	if (Number.isNaN(n)) throw new g("Not a number: " + JSON.stringify(e), t);
	return n;
}
function Be(e, t) {
	if (typeof e == "number") {
		if (Math.trunc(e) == e) return e;
	} else if (Me("" + e)) return parseInt(e);
	throw new g("Not an integer: " + e, t);
}
function Ve(e, t) {
	if (e == null || typeof e == "object") throw new g("Bad cast to string: " + JSON.stringify(e), t);
	return String(e);
}
var He = {
	raw: "-",
	unaryChar: "â»",
	binaryChar: "âˆ’"
}, Ue = {
	raw: "?",
	unaryChar: "â¸®",
	binaryChar: "Â¿"
}, We = {
	raw: "~",
	precedence: 1,
	binaryOp: (e, t, n, r) => Ve(e, n) + Ve(t, r),
	evalLeft: !0,
	evalRight: !0
}, Ge = {
	raw: "@",
	precedence: 2,
	unaryOp: (e, t) => gt(e, t),
	evalRight: !1
}, Ke = {
	raw: "+",
	precedence: 3,
	binaryOp: (e, t, n, r) => x(e, n) + x(t, r),
	evalLeft: !0,
	evalRight: !0
}, qe = {
	raw: "âˆ’",
	precedence: 3,
	binaryOp: (e, t, n, r) => x(e, n) - x(t, r),
	evalLeft: !0,
	evalRight: !0
}, Je = {
	raw: "*",
	precedence: 4,
	binaryOp: (e, t, n, r) => x(e, n) * x(t, r),
	evalLeft: !0,
	evalRight: !0
}, Ye = {
	raw: "/",
	precedence: 4,
	binaryOp: (e, t, n, r) => x(e, n) / x(t, r),
	evalLeft: !0,
	evalRight: !0
}, Xe = {
	raw: "\\",
	precedence: 4,
	binaryOp: (e, t, n, r) => {
		let i = x(e, n) / x(t, r);
		return i >= 0 ? Math.floor(i) : Math.ceil(i);
	},
	evalLeft: !0,
	evalRight: !0
}, Ze = {
	raw: "%",
	precedence: 4,
	binaryOp: (e, t, n, r) => x(e, n) % x(t, r),
	evalLeft: !0,
	evalRight: !0
}, Qe = {
	raw: "â»",
	precedence: 5,
	unaryOp: (e, t) => -x(e, t),
	evalRight: !0
}, $e = {
	raw: ".",
	precedence: 6,
	binaryOp: (e, t, n, r) => wt(e, t, r, !1),
	evalLeft: !0,
	evalRight: !1
}, et = {
	raw: "Â¿",
	precedence: 6,
	binaryOp: (e, t, n, r) => wt(e, t, r, !0),
	evalLeft: !0,
	evalRight: !1
}, tt = {
	raw: ":",
	precedence: 7,
	unaryOp: (e, t) => wt(null, e, t),
	evalRight: !1
}, nt = {
	raw: "â¸®",
	precedence: 7,
	unaryOp: (e, t) => wt(null, e, t, !0),
	evalRight: !1
}, rt = {
	raw: "(",
	precedence: 8,
	closeChar: ")"
}, it = {
	raw: "[",
	precedence: 8,
	closeChar: "]"
}, at = {
	raw: "{",
	precedence: 8,
	closeChar: "}"
}, ot = {
	raw: ")",
	precedence: 0
}, st = {
	raw: "]",
	precedence: 0
}, ct = {
	raw: "}",
	precedence: 0
}, lt = [
	He,
	Ue,
	We,
	Ke,
	qe,
	Ge,
	Je,
	Ye,
	Xe,
	Ze,
	Qe,
	$e,
	tt,
	et,
	nt,
	rt,
	it,
	at,
	ot,
	st,
	ct,
	{
		raw: "'",
		precedence: 10,
		closeChar: "'"
	},
	{
		raw: "\"",
		precedence: 10,
		closeChar: "\""
	}
].reduce((e, t) => (e[t.raw] = t, e), {});
function S(e) {
	return e === null ? null : typeof e == "string" ? e in lt ? lt[e] : null : e;
}
function ut(e) {
	let t = S(e);
	return t !== null && (t.unaryChar !== void 0 || t.unaryOp !== void 0);
}
function dt(e) {
	let t = S(e);
	return t !== null && (t.binaryChar !== void 0 || t.binaryOp !== void 0);
}
function ft(e) {
	let t = S(e);
	return t !== null && t.closeChar !== void 0;
}
function pt(e) {
	let t = S(e);
	return t == ot || t == st || t == ct;
}
function mt(e) {
	let t = S(e);
	return t !== null && (t.raw == "\"" || t.raw == "'");
}
var ht = {
	quot: "\"",
	apos: "'",
	lt: "<",
	gt: ">",
	lb: "{",
	rb: "}",
	lbrace: "{",
	rbrace: "}",
	amp: "&",
	tilde: "~",
	at: "@",
	nbsp: "\xA0"
};
function gt(e, t) {
	if (typeof e == "number") return String.fromCharCode(e);
	if (e = Ve(e, t), e) {
		if (e = Oe(e), e.indexOf(";") == e.length - 1 && (e = e.substring(0, e.length - 1)), e[0] == "x" || e[0] == "#" || e[0] >= "0" && e[0] <= "9") {
			e[0] == "#" && (e = e.substring(1));
			let t = 0;
			return e[0] == "x" ? (e = e.substring(1), t = parseInt(e, 16)) : t = parseInt(e, 10), String.fromCharCode(t);
		}
		if (e in ht) return ht[e];
	}
	if (t) throw new g("Not a recognized entity: " + e, t);
	return "";
}
function _t(e) {
	if (typeof e != "string") return e;
	let t = "", n = 0;
	for (; n <= e.length;) {
		let r = e.indexOf("@", n);
		if (r < 0) {
			t += e.substring(n);
			break;
		}
		t += e.substring(n, r);
		let i = e.indexOf(";", r + 1);
		if (i < 0) {
			t += e.substring(r);
			break;
		}
		let a = gt(e.substring(r + 1, i + 1));
		a == "" ? (t += "@", n = r + 1) : (t += a, n = i + 1);
	}
	return t;
}
function vt(e, t, n) {
	for (; n < e.length;) {
		let r = e.indexOf(t, n);
		if (r > 0) {
			let t = 0;
			for (; r - t > 0 && e[r - t - 1] == "`";) t++;
			if (t % 2 == 1) {
				n = r + 1;
				continue;
			}
		}
		return r;
	}
	return -1;
}
function yt(e) {
	let t = "", n = 0;
	for (; n <= e.length;) {
		let r = e.indexOf("`", n);
		if (r < 0) {
			t += e.substring(n);
			break;
		}
		t += e.substring(n, r);
		let i = r + 1 < e.length ? e[r + 1] : "";
		i == "`" || i == "{" || i == "}" ? (t += i, n = r + 2) : (t += "`", n = r + 1);
	}
	return t;
}
function bt(e) {
	let t = "", n = 0;
	for (; n <= e.length;) {
		let r = e.indexOf("`", n);
		if (r < 0) {
			t += e.substring(n);
			break;
		}
		t += e.substring(n, r);
		let i = r + 1 < e.length ? e[r + 1] : "";
		S(i) !== null || i == "`" ? t += i : t += "`" + i, n = r + 2;
	}
	return t;
}
function xt(e, t) {
	t ||= !1;
	let n = [], r = 0;
	for (; r < e.length;) {
		let t = vt(e, "{", r), i = vt(e, "}", r);
		if (i >= r && (t < 0 || i < t)) throw new g("Close-curly brace without an open brace.", {
			source: e,
			offset: i,
			length: 1
		});
		if (t < 0) break;
		if (t > r) {
			let i = {
				text: yt(e.substring(r, t)),
				formula: !1,
				source: e,
				offset: r,
				length: t - r
			};
			n.push(i);
		}
		let a = 1, o = t + 1;
		for (; a > 0;) {
			let n = vt(e, "{", o), r = vt(e, "}", o);
			if (r < 0) throw new g("Unclosed curly braces.", {
				source: e,
				offset: t,
				length: 1
			});
			n >= 0 && n < r ? (a++, o = n + 1) : (a--, o = r + 1);
		}
		let s = {
			text: bt(e.substring(t + 1, o - 1)),
			formula: !0,
			source: e,
			offset: t + 1,
			length: o - 1 - t - 1
		};
		n.push(s), r = o;
	}
	if (r < e.length) {
		let i = t && r == 0, a = {
			text: i ? bt(e) : yt(e.substring(r)),
			formula: i,
			source: e,
			offset: r,
			length: e.length - r
		};
		n.push(a);
	}
	return n;
}
function St(e) {
	try {
		let t = Le(e);
		return t != null && t !== "";
	} catch {
		return !1;
	}
}
function Ct(e) {
	return Ve(Le(e));
}
function wt(e, t, n, r) {
	e === null && (e = r ? _e() : he());
	let i;
	if (typeof t == "number" ? i = t : Me("" + t) && (i = parseInt("" + t)), typeof e == "string") {
		if (i !== void 0) {
			if (i < 0 || i >= e.length) {
				if (r) return "";
				throw new g("Index out of range: " + i + " in " + e, n);
			}
			return e[i];
		}
		if (r) return "";
		throw new g("Named fields are only available on objects: " + t + " in " + JSON.stringify(e), n);
	}
	if (i !== void 0 && Array.isArray(e)) {
		if (i < 0 || i >= e.length) {
			if (r) return "";
			throw new g("Index out of range: " + i + " in " + e, n);
		}
		return e[i];
	}
	let a = Oe(t);
	if (!(a in e)) {
		if (r) return "";
		throw new g("Key not found in context: " + a, n);
	}
	return e[a];
}
//#endregion
//#region src/events.ts
var Tt = {
	cssRoot: "../Css/",
	links: []
}, Et = {};
function Dt(e, t) {
	Et[e] = t;
}
var C;
function Ot(e) {
	if (e?.event) return C = e.event, e.lookup && (e.lookup._safari = C.eventSync ?? ""), C;
	if (e?.safaris) {
		for (let t = 0; t < e.safaris.length; t++) if ($c(e.safaris[t])) {
			e.safari = e.safaris[t];
			break;
		}
	}
	if (!e?.safari) return C = Tt;
	let t = Et[e.safari];
	return t ? (e.lookup && (e.lookup._safari = e.safari), C = t, C) : (console.error("Unrecognized Safari Event ID: " + e.safari + ". Call registerEvent() from your event repo before theBoiler() runs."), C = Tt);
}
function w() {
	return C;
}
function kt() {
	if (!C || !C.backLinks) return;
	let e = Object.keys(C.backLinks);
	for (let t = 0; t < e.length; t++) {
		let n = e[t];
		if (n && $c(n)) return At(C.backLinks[n]);
	}
	if ("" in C.backLinks) return At(C.backLinks[""]);
}
function At(e) {
	let t = document.createElement("a");
	return t.id = "backlink", t.innerText = e.friendly || "Puzzle list", t.href = e.href + window.location.search, t.target = "_blank", t;
}
function jt() {
	return C.validation === !0 ? !0 : C.validation === !1 || C.validation === void 0 ? !1 : $c(C.validation);
}
function Mt(e) {
	if (e in Et) return Et[e];
	for (let t of Object.values(Et)) if (t.title === e || t.eventSync === e) return t;
	return null;
}
//#endregion
//#region src/rating.ts
function Nt(e, t) {
	let n = Bt(), r = document.createElement("div");
	r.id = "__puzzle_rating_ui", n || (r.style.display = "None"), r.appendChild(Ft("Rate this puzzle!")), e.fun && r.appendChild(It("Fun:", "fun", "star", 5)), e.difficulty && r.appendChild(It("Difficulty:", "difficulty", "diff", 5)), e.feedback && r.appendChild(Lt()), document.getElementsByTagName("body")[0].appendChild(r);
}
function Pt(e) {
	let t = document.getElementById("__puzzle_rating_ui");
	t && e != (t.style.display != "None") && (t.style.display = e ? "" : "None");
}
function Ft(e) {
	let t = document.createElement("span");
	return K(t, "rating-label", !0), t.textContent = e, t;
}
function It(e, t, n, r) {
	let i = document.createElement("span");
	K(i, "rating-group", !0), i.appendChild(Ft(e));
	for (let e = 1; e <= r; e++) {
		let a = document.createElement("img");
		a.src = "../Images/Stars/" + n + "-" + e + ".png", a.title = `${t}: ${e} out of ${r}`, K(a, "rating-star", !0), a.setAttribute("data-rating-scale", t), a.setAttribute("data-rating-value", e.toString()), a.onclick = () => {
			Rt(a);
		}, i.appendChild(a);
	}
	return i;
}
function Lt() {
	let e = document.createElement("span");
	K(e, "rating-label", !0);
	let t = document.createElement("button");
	return t.textContent = "Give Feedback", K(t, "rating-feedback-button", !0), t.onclick = () => {
		zt(t);
	}, e.appendChild(t), e;
}
async function Rt(e) {
	let t = Z(e, "rating-group").getElementsByClassName("rating-star"), n = q(e, "selected");
	for (let e = t.length - 1; e >= 0; e--) q(t[e], "selected"), K(t[e], "selected", !1);
	let r = Q(e, "data-rating-scale"), i = parseInt(Q(e, "data-rating-value") || "0");
	n ? i = 0 : (K(e, "selected", !0), r && await pn(r, i));
}
async function zt(e) {
	let t = prompt("Feedback will be forwarded to this puzzle's authors.");
	t && (await mn(t), K(e, "sent", !!t));
}
function Bt() {
	let e = W();
	if (!e || !e.author) return !1;
	let t = w();
	return !(!t || !t.eventSync);
}
//#endregion
//#region src/eventSync.ts
var Vt = /* @__PURE__ */ function(e) {
	return e.Open = "Open", e.Edit = "Edit", e.Attempt = "Attempt", e.Unlock = "Unlock", e.Solve = "Solve", e;
}({}), Ht = {
	hidden: -1,
	locked: 0,
	open: 1,
	loaded: 1,
	edit: 2,
	attempt: 3,
	unlock: 4,
	unlocked: 4,
	solve: 5,
	solved: 5
}, Ut = typeof window < "u" ? window.location.href.substring(0, 5) == "file:" : !0, Wt = !1, Gt = void 0, Kt = void 0, T = void 0, E = void 0, qt = void 0, Jt = -1;
function Yt() {
	return W().titleSync || W().title;
}
function Xt(e, t) {
	Wt = !!e && !W().noSync && !il() && !al() && (!rl() || ol()), Wt ? (Gt = e, Kt = t || e, document.addEventListener("visibilitychange", function(e) {
		$t();
	}), document.getElementsByTagName("body")[0]?.addEventListener("focus", function(e) {
		$t();
	}), $t()) : !il() && !al() && !rl() && (Kt = t || e);
}
async function Zt(e, t) {
	Qt(e), !(!Wt || !T) && await rn("PuzzlePing", {
		eventName: Gt,
		player: T,
		avatar: qt,
		team: E,
		puzzle: Yt(),
		activity: e,
		data: t || ""
	});
}
function Qt(e) {
	if (!Kt) return;
	let t = Yt();
	if (!t) return;
	let n = Ht[e.toLowerCase()];
	if (n > Jt) {
		Jt = n;
		let r = "Usage-Milestone-" + Kt, i = za(t, void 0, r)?.toLowerCase() || "";
		(!i || !(i in Ht) || Ht[i] < n) && (rn("Usage", {
			eventName: Kt,
			puzzle: t,
			activity: e
		}), Ra(t, e, r));
	}
}
function $t() {
	if (!Wt) return;
	let e = Ja(Gt);
	e && (T != e.player || E != e?.team) ? (T = e.player, E = e.team || "", qt = e.emoji || "", Zt("Open")) : (!e || !e.player) && (T = E = qt = void 0), nn();
}
function en(e) {
	e.stopPropagation(), tn(null);
	let t = document.getElementById("modal-login"), n = document.getElementById("modal-iframe");
	if (t && n) n.src = `LoginUI.xhtml?iframe&modal&${W().safari}`, K(t, "hidden", !1);
	else {
		t = document.createElement("div");
		let e = document.createElement("div"), r = document.createElement("span");
		n = document.createElement("iframe"), t.id = "modal-login", n.id = "modal-iframe", K(e, "modal-content", !0), K(r, "modal-close", !0), r.appendChild(document.createTextNode("Ã—")), r.title = "Close", r.onclick = function(e) {
			tn(e);
		}, n.src = `LoginUI.xhtml?iframe&modal&${W().safari}`, e.appendChild(r), e.appendChild(n), t.appendChild(e), document.getElementById("pageBody")?.appendChild(t), document.getElementById("pageBody")?.addEventListener("click", function(e) {
			tn(e);
		});
	}
}
function tn(e) {
	var t = document.getElementById("modal-login");
	t && (q(t, "hidden") || (K(t, "hidden", !0), $t(), an())), e && e.stopPropagation();
}
function nn() {
	let e = document.getElementById("Login-bar"), t = document.getElementsByTagName("body")[0];
	e || (e = document.createElement("div"), e.id = "Login-bar", document.getElementsByTagName("body")[0].appendChild(e));
	let n = document.getElementById("Login-icon");
	n || (n = document.createElement("img"), n.id = "Login-icon", e.appendChild(n));
	let r = document.getElementById("Login-avatar");
	r || (r = document.createElement("span"), r.id = "Login-avatar", e.appendChild(r));
	let i = document.getElementById("Login-player");
	i || (i = document.createElement("span"), i.id = "Login-player", e.appendChild(i)), K(t, "logged-in-player", !!T), K(t, "logged-in-avatar", !!qt), K(t, "logged-in-team", !!E), K(e, "logged-in", !!T), K(e, "avatar", !!qt), T ? (qt ? r.innerText = qt : (n.src = E ? "../Icons/logged-in-team.png" : "../Icons/logged-in.png", r.innerHTML = ""), i.innerText = E ? T + " @ " + E : T, e.onclick = function(e) {
		en(e);
	}, e.title = "Log out?", Pt(!0)) : (n.src = "../Icons/logged-out.png", r.innerHTML = "", i.innerText = "Login?", e.onclick = function(e) {
		en(e);
	}, e.title = "Log in?");
}
async function rn(e, t, n, r) {
	try {
		var i = new XMLHttpRequest(), a = (Ut ? "http://localhost:7071/api/" : "https://puzzyleventsync.azurewebsites.net/api/") + e;
		i.open("POST", a, !0), i.setRequestHeader("Content-type", "application/json; charset=UTF-8"), i.onreadystatechange = function() {
			if (i.readyState === 4) {
				hu(i.responseText);
				let t = i.responseText, a = !0;
				try {
					var e = Gi(t, !1);
					a = !1, n && n(e);
				} catch (e) {
					t = i.responseText || i.statusText, console.error(e);
				}
				a && r && r(t);
			}
		};
		var o = JSON.stringify(t);
		hu(`Calling ${e} with data=${o}`), i.send(o);
	} catch (e) {
		console.error(e);
	}
}
async function an(e) {
	if (!Wt || !E) {
		on = [], sn = {}, cn = [], e ? e() : ln && ln();
		return;
	}
	let t = {
		eventName: Gt,
		team: E,
		player: T
	};
	e ? ln = e : e = ln, ln && await rn("TeamHomePage", t, un);
}
var on, sn, cn = [], ln = void 0;
function un(e) {
	if (e != null) {
		var t = !1;
		"teammates" in e && (e.teammates, t = !0), "solves" in e && (e.solves, t = !0), "unlocked" in e && (e.unlocked, t = !0), t && ln && ln();
	}
}
function dn() {
	return window.location.protocol + "//" + window.location.host + window.location.pathname;
}
async function fn(e, t) {
	!Wt || !E || await rn("PuzzlePing", {
		eventName: Gt,
		player: T,
		avatar: qt,
		team: E,
		puzzle: e,
		activity: "Unlock",
		data: t
	});
}
async function pn(e, t) {
	Wt && await rn("RatePuzzle", {
		eventName: Gt,
		player: T || "",
		avatar: qt || "",
		team: E || "",
		puzzle: Yt(),
		activity: Jt,
		data: `${e}:${t}`
	});
}
async function mn(e) {
	Wt && await rn("GiveFeedback", {
		eventName: Gt,
		player: T || "",
		avatar: qt || "",
		team: E || "",
		puzzle: Yt(),
		activity: Jt,
		data: e
	});
}
//#endregion
//#region src/meta.ts
var D;
function hn(e) {
	if (!e || rl()) return;
	let t = document.getElementsByTagName("body")[0];
	if (!t) throw Error("Seting up meta sync requires a <body> tag");
	if (D = {
		id: e.id,
		count: e.count,
		onSync: e.onSync,
		refillClass: e.refillClass,
		refillTemplate: e.refillTemplate,
		materials: Array(e.count).fill(null)
	}, e.refillClass) {
		let t = document.getElementsByClassName(e.refillClass);
		if (t.length != e.count) throw new g("Refill class (" + e.refillClass + ") has " + t.length + " instances, whereas " + e.count + " meta materials are expected.");
		if (!e.refillTemplate) throw new g("MetaParam specified refillClass (" + e.refillClass + ") without also specifying refillTemplate.");
		for (let e = 0; e < t.length; e++) K(t[e], "locked", !0), K(t[e], "unlocked", !1);
	} else if (e.refillTemplate && !e.refillClass) throw new g("MetaParam specified refillTemplate (" + e.refillTemplate + ") without also specifying refillClass.");
	else if (!e.onSync) throw new g("MetaParam expects either an onSync callback, or else both refill fields.");
	document.addEventListener("visibilitychange", function(e) {
		gn();
	}), t.addEventListener("focus", function(e) {
		gn();
	}), gn(!0);
}
function gn(e) {
	let t = e || !1;
	for (var n = 0; n < D.count; n++) if (!D.materials[n]) {
		var r = Ua(D.id, D.up || 0, n);
		r && (D.materials[n] = r, t = !0);
	}
	if (Ua(D.id, D.up || 0, D.count)) throw new g("WARNING: Meta materials may be misnumbered. Expected #0 - #" + (D.count - 1) + " but found #" + D.count);
	t && (D.onSync && D.onSync(D.materials), D.refillClass && _n(D.materials));
}
function _n(e) {
	let t = document.getElementsByClassName(D.refillClass);
	for (var n = 0; n < t.length; n++) if (e[n]) {
		var r = t[n];
		q(r, "unlocked") || (ar(r, D.refillTemplate, e[n]), K(r, "locked", !1), K(r, "unlocked", !0));
	}
}
//#endregion
//#region src/confirmation.ts
var vn = {
	Error: 0,
	Correct: 1,
	Confirm: 2,
	KeepGoing: 3,
	Unlock: 4,
	Load: 5,
	Show: 6
}, yn = [
	"rt-error",
	"rt-correct",
	"rt-confirm",
	"rt-keepgoing",
	"rt-unlock",
	"rt-load"
], bn = "0", xn = [
	"Incorrect",
	"Correct!",
	"Confirmed",
	"Keep going"
], Sn = [
	"../Icons/X.png",
	"../Icons/Check.png",
	"../Icons/Thumb.png",
	"../Icons/Thinking.png",
	"../Icons/Unlocked.png"
], Cn = [];
function wn() {
	let e = document.getElementsByTagName("body")[0];
	e && K(e, "show-validater", !0);
	let t = document.getElementsByClassName("validater");
	if (t.length > 0 && !Mn("")) {
		let e = document.createElement("div");
		e.id = "guess-log";
		let t = document.createElement("div");
		t.id = "guess-history";
		let n = document.createElement("span");
		n.id = "guess-titlebar", n.appendChild(document.createTextNode("Submissions")), e.appendChild(n), e.appendChild(t), document.getElementById("pageBody")?.appendChild(e);
	}
	for (let e = 0; e < t.length; e++) {
		let n = t[e];
		if (X(n, "button")) {
			n.onclick = function(e) {
				Nn(e.target);
			};
			let e = Q(n, "data-extracted-id") || "extracted", t = document.getElementById(e);
			if (t && X(t, "span")) {
				let e = t.getElementsByTagName("input");
				e && e.length == 1 && (t = e[0]);
			}
			t && (X(t, "input") && t.type == "text" || X(t, "textarea")) && (t.onkeyup = function(e) {
				An(n, e.key);
			}), An(n, null);
		}
	}
}
function Tn(e, t) {
	let n = document.getElementById("fontExtents");
	n || (n = document.createElement("span"), n.id = "fontExtents", n.style.position = "absolute", document.getElementsByTagName("body")[0].appendChild(n)), n.innerText = t;
	let r = window.getComputedStyle(e, null);
	return n.style.fontFamily = r.getPropertyValue("font-family"), n.style.fontSize = r.getPropertyValue("font-size"), n.style.fontWeight = r.getPropertyValue("font-weight"), n.style.fontStretch = r.getPropertyValue("font-stretch"), n.style.textTransform = r.getPropertyValue("text-transform"), n.scrollWidth;
}
function En(e, t) {
	let n = parseFloat(e.getAttribute("data-original-width") || "");
	n || (n = Dn(e, "width"), e.setAttribute("data-original-width", "" + n)), t.length == 0 && (e.style.transform = "scale(100%, 100%)", e.style.width = n + "px");
	let r = kn(e, "scale", On.scaleX, 1), i = Tn(e, t + "|");
	if (i * r > n) {
		let r = Tn(e, t + " 12345678"), i = Math.floor(n * 100 / r);
		i > 33 && (e.style.transformOrigin = "left", e.style.transform = "scale(" + i + "%, 100%)", e.style.width = Math.floor(n * 100 / i) + "px"), Tn(e, t);
	} else e.style.transform.indexOf("scale") == 0 && i < n && (e.style.transformOrigin = "left", e.style.transform = "initial", e.style.width = n + "px");
}
function Dn(e, t) {
	let n = window.getComputedStyle(e, null).getPropertyValue(t);
	return parseFloat(n.substring(0, n.length - 2));
}
var On = {
	scaleX: 0,
	rotX: 1,
	rotY: 2,
	scaleY: 3,
	translateX: 4,
	translateY: 5
};
function kn(e, t, n, r) {
	let i = window.getComputedStyle(e, null).getPropertyValue("transform"), a = "1, 0, 0, 0, 1, 0";
	i && i.substring(0, 7) == "matrix(" && (a = i.substring(7, i.length - 8));
	let o = a.split(",");
	if (n < o.length) {
		let e = o[n];
		return e.substring(e.length - 1) == "%" ? parseFloat(e.substring(0, e.length - 1)) * .01 : e.substring(e.length - 2) == "px" ? parseFloat(e.substring(0, e.length - 2)) : parseFloat(e);
	}
	return r;
}
function An(e, t) {
	let n = Q(e, "data-extracted-id", "extracted"), r = n ? document.getElementById(n) : null;
	if (!r) {
		console.error("Button " + e.id + " missing a valid \"data-extracted-id\" linking to its source: " + n);
		return;
	}
	let i = Es(r, "_"), a = jn(e, i);
	hu(`Value ${i} is ${a ? "" : "NOT "} ready`), K(e, "ready", a), a && (t == "Enter" || t == "NumpadEnter") ? Nn(e) : (X(r, "input") || X(r, "textarea")) && En(r, i);
}
function jn(e, t) {
	if (!t || t.indexOf("_") >= 0) return !1;
	let n = Q(e, "data-min-length");
	return n ? t.length >= parseInt(n) : t.length > 0;
}
function Mn(e) {
	return document.getElementById("guess-history");
}
function Nn(e) {
	let t = Q(e, "data-extracted-id", "extracted");
	if (!t) return;
	let n = document.getElementById(t);
	if (!n) return;
	let r = Es(n, "_");
	jn(e, r) && Pn({
		field: t,
		guess: r,
		time: /* @__PURE__ */ new Date()
	});
}
function Pn(e) {
	hu(`Guess ${e.guess}`);
	let t = Bn();
	if (!t) {
		console.error("No validation data");
		return;
	}
	let n = e.field;
	if (!(n in t) && "" in t && (n = ""), n in t) {
		let r = t[n];
		e.guess = e.guess.toUpperCase();
		let i = e.guess.replace(/[^a-zA-Z0-9]/g, ""), a = Ln(i), o = Fn(e), s = !1;
		if (a in r) {
			let e = r[a].split("|");
			for (let t = 0; t < e.length; t++) s = In(o, e[t]) || s;
		} else In(o, bn);
		Zt(s ? Vt.Solve : Vt.Attempt, i);
	} else console.error("Unrecognized validation field: " + e.field);
}
function Fn(e) {
	Cn.push(e), la(Cn);
	let t = Mn(e.field), n = document.createElement("div");
	n.classList.add("rt-block");
	let r = document.createElement("div");
	r.classList.add("rt-guess"), r.appendChild(document.createTextNode(e.guess));
	let i = e.time, a = i.getHours() + ":" + (i.getMinutes() < 10 ? "0" : "") + i.getMinutes() + ":" + (i.getSeconds() < 10 ? "0" : "") + i.getSeconds(), o = document.createElement("span");
	return o.classList.add("rt-time"), o.appendChild(document.createTextNode(a)), r.appendChild(o), n.appendChild(r), t.insertAdjacentElement("afterbegin", n), n;
}
function In(e, t) {
	let n = parseInt(t[0]);
	t = t.substring(1), t = t.length == 0 && n < xn.length ? xn[n] : Ln(t);
	let r = document.createElement("div");
	if (r.classList.add("response"), r.classList.add(yn[n]), n == vn.Unlock) {
		let e = t.indexOf("^"), n = e < 0 ? t : t.substring(e + 1);
		if (e >= 0) {
			t = t.substring(0, e);
			var i = (window.location.search ?? "?").substring(1);
			i && (t.indexOf("?") >= 0 ? t += "&" + i : t += "?" + i);
		}
		hu(`Unlocking ${t}` + (e >= 0 ? `(aka ${n})` : "")), r.appendChild(document.createTextNode("You have unlocked "));
		let a = document.createElement("a");
		a.href = t, a.target = "_blank", a.appendChild(document.createTextNode(n)), r.appendChild(a);
	} else if (n == vn.Load) {
		hu(`Loading ${t}`);
		var i = (window.location.search ?? "?").substring(1);
		i && (t.indexOf("?") >= 0 ? t += "&" + i : t += "?" + i);
		let e = document.createElement("iframe");
		e.src = t, r.appendChild(e), W().metaParams && setTimeout(() => {
			gn();
		}, 1e3);
	} else if (n == vn.Show) {
		let e = t.split("^"), n = document.getElementById(e[0]);
		n ? e.length > 1 ? K(n, e[1]) : n.style.display = "block" : console.error("Cannot show id=" + e[0]);
	} else hu(`Validation response (type ${n}) : ${t}`), r.appendChild(document.createTextNode(t));
	if (n < Sn.length) {
		let e = document.createElement("img");
		e.classList.add("rt-img"), e.src = Sn[n], r.appendChild(e);
	}
	return e.appendChild(r), setTimeout(() => {
		r.scrollIntoView({
			behavior: "smooth",
			block: "end"
		});
	}, 100), n == vn.Correct ? (K(document.getElementsByTagName("body")[0], "solved", !0), Ra(Ga(), La.Solved), !0) : !1;
}
function Ln(e) {
	let t = "";
	for (let n = 0; n < e.length; n++) {
		let r = e[n], i = r;
		r >= "A" && r <= "Z" ? i = String.fromCharCode((r.charCodeAt(0) - 52) % 26 + 65) : r >= "a" && r <= "z" && (i = String.fromCharCode((r.charCodeAt(0) - 84) % 26 + 97)), t += i;
	}
	return t;
}
function Rn() {
	return typeof validation < "u" ? validation : W().validation;
}
var zn;
function Bn() {
	return zn ||= Rn(), zn;
}
//#endregion
//#region src/templates.ts
function Vn(e) {
	if (e) {
		let t = document.getElementById(e);
		if (t) return t;
		let n = Un(e);
		if (n) return n;
	}
	throw new g("Template not found: " + e);
}
var Hn = {
	paintByNumbers: Gn,
	paintByColorNumbers: Kn,
	classStampPalette: qn,
	classStampNoTools: Jn,
	finalAnswer: Yn,
	extractedCopiableSpan: Xn,
	extractedCopiablePattern: Zn,
	copiablePattern: Qn
};
function Un(e) {
	if (e in Hn) return Hn[e]();
}
function Wn(e, t) {
	for (let [n, r] of Object.entries(t)) e.setAttribute("default-" + n, r);
}
function Gn() {
	U(w().cssRoot + "PaintByNumbers.css");
	let e = document.createElement("template");
	return e.id = "paintByNumbers", e.innerHTML = "<ttable class=\"paint-by-numbers stampable-container stamp-drag bolden_5 bolden_10\" data-col-context=\"{cols$}\" data-row-context=\"{rows$}\">\n    <tthead>\n      <ttr class=\"pbn-col-headers\">\n        <tth class=\"pbn-corner\">\n          <span class=\"pbn-instructions\">\n            This is a nonogram<br />(aka paint-by-numbers).<br />\n            For instructions, see \n            <a href=\"https://help.puzzyl.net/PBN\" target=\"_blank\">\n              https://help.puzzyl.net/PBN<br />\n              <img src=\"../Images/Intro/pbn.png\" />\n            </a>\n          </span>\n        </tth>\n        <for each=\"col\" in=\"{colGroups}\">\n          <ttd id=\"colHeader-{col#}\" class=\"pbn-col-header\">\n            <for each=\"group\" in=\"{col}\"><span class=\"pbn-col-group\" onclick=\"togglePbnClue(this)\">{group}</span></for>\n          </ttd>\n        </for>\n        <tth class=\"pbn-row-footer pbn-corner\">&#xa0;</tth>\n      </ttr>\n    </tthead>\n    <for each=\"row\" in=\"{rowGroups}\">\n      <ttr class=\"pbn-row\">\n        <ttd id=\"rowHeader-{row#}\" class=\"pbn-row-header\">\n          &#x200a; <for each=\"group\" in=\"{row}\"><span class=\"pbn-row-group\" onclick=\"togglePbnClue(this)\">{group}</span> </for>&#x200a;\n        </ttd>\n        <for each=\"col\" in=\"{colGroups}\">\n          <ttd id=\"{row#}_{col#}\" class=\"pbn-cell stampable\">&times;</ttd>\n        </for>\n        <ttd class=\"pbn-row-footer\"><span id=\"rowSummary-{row#}\" class=\"pbn-row-validation\"></span></ttd>\n      </ttr>\n    </for>\n    <ttfoot>\n      <ttr class=\"pbn-col-footer\">\n        <tth class=\"pbn-corner\">&#xa0;</tth>\n        <for each=\"col\" in=\"{colGroups}\">\n          <ttd class=\"pbn-col-footer\"><span id=\"colSummary-{col#}\" class=\"pbn-col-validation\"></span></ttd>\n        </for>\n        <tth class=\"pbn-corner-validation\">\n          êœ›&#xa0;&#xa0;&#xa0;&#xa0;êœ›&#xa0;&#xa0;&#xa0;&#xa0;êœ›\n          <br />â†&#xa0;validation</tth>\n      </ttr>\n    </ttfoot>\n  </ttable>", e;
}
function Kn() {
	U(w().cssRoot + "PaintByNumbers.css");
	let e = document.createElement("template");
	return e.id = "paintByNumbers", e.innerHTML = "<ttable class=\"paint-by-numbers stampable-container stamp-drag pbn-two-color {?styles}\" data-col-context=\"{cols$}\" data-row-context=\"{rows$}\" data-stamp-list=\"{stamplist}\">\n    <tthead>\n      <ttr class=\"pbn-col-headers\">\n        <tth class=\"pbn-corner\">\n          <span class=\"pbn-instructions\">\n            This is a nonogram<br />(aka paint-by-numbers).<br />\n            For instructions, see \n            <a href=\"https://help.puzzyl.net/PBN\" target=\"_blank\">\n              https://help.puzzyl.net/PBN<br />\n              <img src=\"https://help.puzzyl.net/pbn.png\" />\n            </a>\n          </span>\n        </tth>\n        <for each=\"col\" in=\"{colGroups}\">\n          <ttd id=\"colHeader-{col#}\" class=\"pbn-col-header\">\n            <for each=\"colorGroup\" in=\"{col}\"><for key=\"color\" in=\"{colorGroup}\"><for each=\"group\" in=\"{color!}\"><span class=\"pbn-col-group pbn-color-{color}\" onclick=\"togglePbnClue(this)\">{group}</span></for></for></for>\n          </ttd>\n        </for>\n        <if test=\"?validate\" ne=\"false\">\n          <tth class=\"pbn-row-footer pbn-corner\">&#xa0;</tth>\n        </if>\n      </ttr>\n    </tthead>\n      <for each=\"row\" in=\"{rowGroups}\">\n        <ttr class=\"pbn-row\">\n          <ttd id=\"rowHeader-{row#}\" class=\"pbn-row-header\">\n            &#x200a; \n            <for each=\"colorGroup\" in=\"{row}\"><for key=\"color\" in=\"{colorGroup}\">\n              <for each=\"group\" in=\"{color!}\"><span class=\"pbn-row-group pbn-color-{color}\" onclick=\"togglePbnClue(this)\">{group}</span> </for>\n            &#x200a;</for></for>\n          </ttd>\n          <for each=\"col\" in=\"{colGroups}\">\n          <ttd id=\"{row#}_{col#}\" class=\"pbn-cell stampable\">{?blank}</ttd>\n        </for>\n        <if test=\"?validate\" ne=\"false\">\n          <ttd class=\"pbn-row-footer\"><span id=\"rowSummary-{row#}\" class=\"pbn-row-validation\"></span></ttd>\n        </if>\n      </ttr>\n    </for>\n    <if test=\"?validate\" ne=\"false\">\n      <ttfoot>\n        <ttr class=\"pbn-col-footer\">\n          <tth class=\"pbn-corner\">&#xa0;</tth>\n          <for each=\"col\" in=\"{colGroups}\">\n            <ttd class=\"pbn-col-footer\"><span id=\"colSummary-{col#}\" class=\"pbn-col-validation\"></span></ttd>\n          </for>\n          <tth class=\"pbn-corner-validation\">\n            êœ›&#xa0;&#xa0;&#xa0;&#xa0;êœ›&#xa0;&#xa0;&#xa0;&#xa0;êœ›\n            <br />â†&#xa0;validation</tth>\n        </ttr>\n      </ttfoot>\n    </if>\n  </ttable>", e;
}
function qn() {
	U(w().cssRoot + "PaintByNumbers.css");
	let e = document.createElement("template");
	return e.id = "classStampPalette", e.innerHTML = "<div id=\"stampPalette\" data-tool-count=\"3\" data-tool-erase=\"{erase}\">\n    <for each=\"tool\" in=\"{tools}\">\n      <div id=\"{tool.id}\" class=\"stampTool {?size}\" data-stamp-id=\"{tool.id}\" data-style=\"{tool.id}\" data-click-modifier=\"{tool?modifier}\" title=\"{tool?modifier} + draw\" data-next-stamp-id=\"{tool.next}\">\n        <div class=\"roundTool {tool.id}-button\">\n          <span id=\"{tool.id}-icon\" class=\"stampIcon\"><img src_=\"{tool.img}\" /></span>\n          <span id=\"{tool.id}-label\" class=\"stampLabel\">{tool?label}</span>\n          <span id=\"{tool.id}-mod\" class=\"stampMod\">{tool?modifier}+click</span>\n        </div>\n      </div>\n    </for>\n  </div>", e;
}
function Jn() {
	U(w().cssRoot + "PaintByNumbers.css");
	let e = document.createElement("template");
	return e.id = "classStampPalette", e.innerHTML = "<div id=\"stampPalette\" class=\"hidden\" data-tool-erase=\"{erase}\">\n    <for each=\"tool\" in=\"{tools}\">\n      <div class=\"stampTool\" id=\"{tool.id}\" data-next-stamp-id=\"{tool.next}\" data-style=\"{tool.id}\">\n      </div>\n    </for>\n  </div>", e;
}
function Yn() {
	let e = document.createElement("template");
	return Wn(e, {
		left: "2in",
		bottom: "-60px",
		width: "3in"
	}), e.innerHTML = "<div class=\"no-print validate-block\" style=\"position:absolute; bottom:{bottom}; left:{left};\">\n      <span class=\"no-user-select\">Submit: </span>\n      <word id=\"__final-answer\" class=\"extracted\" data-show-ready=\"__submit-answer\" style=\"width:{width}; top:6px;\" />\n      <button class=\"validater ready\" id=\"__submit-answer\" data-extracted-id=\"__final-answer\">OK</button>\n    </div>", e;
}
function Xn() {
	let e = document.createElement("template");
	Wn(e, {
		tag: "div",
		id: "extracted"
	});
	var t = "<span id=\"{id}\" data-show-ready=\"submit-extracted\" />\n    <button id=\"submit-extracted\" class=\"copy-extracted btn-shift-up\" data-extracted-id=\"{id}\" onclick=\"copyto_final_answer('{id}')\">OK</button>";
	return e.innerHTML = "<if test=\"{tag}\" eq=\"span\">\n      <span id=\"__extracted-span\">" + t + "</span></if>\n    <else>\n      <div id=\"__extracted-div\">" + t + "</div></else>", e;
}
function Zn() {
	let e = document.createElement("template");
	Wn(e, {
		tag: "div",
		id: "extracted"
	});
	var t = "<if exists=\"{?pattern}\">\n      <pattern id=\"{id}\" pattern=\"{pattern}\" data-show-ready=\"submit-extracted\" />\n    </if><elseif exists=\"{?numbered}\">\n      <pattern id=\"{id}\" extract-numbered=\"{numbered}\" data-show-ready=\"submit-extracted\" />\n    </elseif>\n    <button id=\"submit-extracted\" class=\"copy-extracted btn-shift-up\" data-extracted-id=\"{id}\" onclick=\"copyto_final_answer('{id}')\">OK</button>";
	return e.innerHTML = "<if test=\"{tag}\" eq=\"span\">\n      <span id=\"__extracted-span\">" + t + "</span></if>\n    <else>\n      <div id=\"__extracted-div\">" + t + "</div></else>", e;
}
function Qn() {
	let e = document.createElement("template");
	Wn(e, {
		tag: "div",
		id: "copiable"
	});
	var t = "<pattern id=\"{id}\" pattern=\"{pattern}\" data-show-ready=\"submit-copiable\" />\n    <button id=\"submit-copiable\" class=\"copy-extracted btn-shift-up\" data-extracted-id=\"{id}\" onclick=\"copyto_final_answer('{id}')\">OK</button>";
	return e.innerHTML = "<if test=\"{tag}\" eq=\"span\">\n      <span id=\"__copiable-span\">" + t + "</span></if>\n    <else>\n      <div id=\"__copiable-div\">" + t + "</div></else>", e;
}
function $n(e = "extracted") {
	let t = document.getElementById(e), n = document.getElementById("__final-answer")?.getElementsByTagName("input"), r = document.getElementById("__submit-answer");
	if (t && n && n.length > 0 && r) {
		var i = "", a = t.getElementsByTagName("input");
		if (a.length == 0) i = t.textContent;
		else for (var o = 0; o < a.length; o++) i += a[o].value;
		n[0].value = i, An(r, "Enter");
	} else console.error("Missing expected elements for copyto_final_answer");
}
//#endregion
//#region src/builderUse.ts
function er(e, t) {
	let n = [];
	if (!t) {
		if (t = e.getAttribute("template"), !t) throw new g("<use> tag must specify a template attribute");
		t = Ee(t, !1);
	}
	let r = null;
	try {
		if (r = Vn(t), !r.content) throw new g("Invalid template (no content): " + t);
	} catch (t) {
		let n = _(t, "useTemplate", v(e, "template"));
		if (ru(n, e)) throw n;
		r = null;
	}
	if (r) {
		let i = tr(e, r);
		rr(r, i);
		try {
			if (ir(i), $l(e), t ||= e.getAttribute("template"), t) {
				let r = Vn(t);
				if (!r) throw new g("Template not found: " + t, v(e, "template"));
				if (!r.content) throw new g("Invalid template (no content): " + t, v(e, "template"));
				$l(r), n = lu(r.content.cloneNode(!0)), eu();
			} else n = lu(e);
			eu();
		} catch (t) {
			let n = _(t, "useTemplate", v(e));
			if (ru(n, e, r)) throw n;
		}
		be();
	}
	return n;
}
function tr(e, t) {
	let n = [];
	for (let r = 0; r < e.attributes.length; r++) {
		let i = e.attributes[r].name, a = e.attributes[r].value, o = i.toLowerCase();
		try {
			if (o != "template" && o != "class") {
				let e = {
					attr: i,
					raw: a,
					text: Ee(a, !1),
					any: De(a)
				};
				n.push(e);
			}
		} catch (n) {
			let r = _(n, "parseUseNodeArgs", v(e, i));
			if (ru(r, e, t)) throw r;
		}
	}
	return n;
}
function nr(e) {
	if (!e) return [];
	let t = [], n = Object.keys(e);
	for (let r = 0; r < n.length; r++) {
		let i = n[r], a = e[i], o = i.toLowerCase();
		try {
			if (o != "template" && o != "class") {
				let e = {
					attr: i,
					raw: "",
					text: JSON.stringify(a),
					any: a
				};
				t.push(e);
			}
		} catch (e) {
			throw _(e, "parseObjectAsUseArgs");
		}
	}
	return t;
}
function rr(e, t) {
	for (let n = 0; n < e.attributes.length; n++) {
		let r = e.attributes[n].name;
		if (!r.startsWith("default-")) continue;
		let i = r.substring(8);
		if (t.some((e) => e.attr == i)) continue;
		let a = e.attributes[n].value;
		try {
			let e = {
				attr: i,
				raw: a,
				text: Ee(a, !1),
				any: De(a)
			};
			t.push(e);
		} catch (t) {
			let n = _(t, "overlayDefaultTemplateArgs");
			if (ru(n, e)) throw n;
		}
	}
}
function ir(e) {
	let t = ye();
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		t[r.attr] = r.any, t[r.attr + "!"] = r.text, t[r.attr + "$"] = r.raw, tl() && (console.log("Use template arg #" + n + ": " + r.attr + " = " + JSON.stringify(r.any)), console.log("Use template arg #" + n + ": " + r.attr + "! = " + r.text), console.log("Use template arg #" + n + ": " + r.attr + "$ = " + r.raw));
	}
	return t;
}
function ar(e, t, n) {
	return sr(e, cr, t, n);
}
function or(e, t, n) {
	return sr(e, lr, t, n);
}
function sr(e, t, n, r) {
	if (!n) throw new g("Template ID not specified");
	let i = Vn(n);
	if (!i) throw new g("Template not found: " + n);
	if (!i.content) throw new g("Invalid template (no content): " + n);
	Xl(e);
	let a;
	try {
		ir(nr(r ?? {})), $l(i);
		let n = lu(i.content.cloneNode(!0));
		a = n.filter((e) => e.nodeType == Node.ELEMENT_NODE)[0], a ||= n[0], eu(), t(e, n);
	} catch (e) {
		let t = _(e, "injectFromTemplate", v(i));
		if (ru(t, i)) throw t;
	}
	return be(), a;
}
function cr(e, t) {
	for (; e.childNodes.length > 0;) e.removeChild(e.childNodes[0]);
	lr(e, t);
}
function lr(e, t) {
	for (let n = 0; n < t.length; n++) e.appendChild(t[n]);
}
//#endregion
//#region src/stampTools.ts
function ur(e) {
	return {
		name: "",
		container: e || null,
		palette: null,
		stampTools: [],
		selectedTool: null,
		firstTool: null,
		eraseTool: null,
		extractorTool: null,
		canDrag: !1,
		prevStampablePointer: null,
		dragDrawTool: null,
		lastDrawTool: null,
		usesMods: !1
	};
}
var O = {};
function dr() {
	let e = document.getElementsByClassName("stampable-container");
	for (let t = 0; t < e.length; t++) {
		let n = e[t];
		n.addEventListener("pointerdown", hr);
		let r = ur(n);
		if (fr(n, r), q(n, "stamp-drag") ? (r.canDrag = !0, n.addEventListener("pointerup", gr), n.addEventListener("pointermove", _r), n.addEventListener("pointerleave", vr)) : r.canDrag = !1, r.name = n.getAttributeNS("", "data-stamp-set") || "", r.name in O) throw new g("Different stampable-containers must have unique names: " + r.name, v(n, "data-stamp-set"));
		O[r.name] = r;
	}
	let t = document.getElementsByClassName("stampable");
	if (e.length == 0 && t.length > 0) {
		O[""] = ur();
		let e = document.getElementById("pageBody");
		e && e.addEventListener("pointerdown", hr);
	}
	let n = Iu("stampPalette", "stampPalette");
	for (let e = 0; e < n.length; e++) {
		let r = n[e], i = r.getAttributeNS("", "data-stamp-set") || "";
		i in O || (O[i] = ur());
		let a = O[i];
		t = r.getElementsByClassName("stampTool");
		for (let e = 0; e < t.length; e++) {
			let n = t[e];
			a.stampTools.push(n), n.onclick = function(e) {
				xr(e);
			}, Q(n, "data-click-modifier") && (a.usesMods = !0);
		}
		let o = r.getAttributeNS("", "data-tool-extractor");
		if (o != null && (a.extractorTool = document.getElementById(o), a.extractedId = Q(a.extractorTool, "data-extracted-id", void 0, "extracted-") || Q(a.container, "data-extracted-id", void 0, "extracted-") || "extracted"), o = r.getAttributeNS("", "data-tool-erase"), o != null) a.eraseTool = o == null ? null : document.getElementById(o);
		else {
			let e = r.getAttributeNS("", "data-unstyle"), t = r.getAttributeNS("", "data-style");
			(e || t) && (a.eraseTool = document.createElement("span"), e && a.eraseTool.setAttributeNS("", "data-unstyle", e), t && a.eraseTool.setAttributeNS("", "data-style", t));
		}
		o = r.getAttributeNS("", "data-tool-first"), a.firstTool = o == null ? null : document.getElementById(o), a.firstTool ||= a.stampTools[0];
	}
}
function fr(e, t) {
	let n = Q(e, "data-stampable-rules");
	if (n) {
		let t = n.split(" ");
		for (let n = 0; n < t.length; n++) {
			let r = t[n];
			if (r[0] == ".") {
				let t = e.getElementsByClassName(r.substring(1));
				for (let e = 0; e < t.length; e++) K(t[e], "stampable", !0);
			} else if (r[0] == "#") K(document.getElementById(r.substring(1)), "stampable", !0);
			else {
				let t = e.getElementsByTagName(r.toLowerCase());
				for (let e = 0; e < t.length; e++) K(t[e], "stampable", !0);
			}
		}
	}
}
function pr(e) {
	return mr(e.target);
}
function mr(e) {
	let t = Q(e, "data-stamp-set") || "";
	if (!(t in O)) throw Error("Cannot find stamp set matching target: " + e);
	let n = O[t];
	if (n && (!n.stampTools || n.stampTools.length == 0)) {
		let e = n.container?.getAttributeNS("", "data-stamp-palette") ?? "", i = Object.keys(O);
		for (var r = 0; r < i.length; r++) {
			let n = O[i[r]];
			if (i[r] == e && n.stampTools) return O[t] = n, n;
		}
	}
	return n;
}
function hr(e) {
	if (!Mr(e)) return;
	let t = pr(e);
	if (!t.usesMods && (e.ctrlKey || e.shiftKey || e.altKey)) return;
	e.pointerType != "mouse" && t.canDrag && e.preventDefault();
	let n = yr(e);
	n && (t.prevStampablePointer = n, jr(t, e, n));
}
function gr(e) {
	if (!Mr(e)) return;
	let t = pr(e);
	!t.usesMods && (e.ctrlKey || e.shiftKey || e.altKey) || (e.pointerType != "mouse" && t.canDrag && e.preventDefault(), t.prevStampablePointer = null);
}
function _r(e) {
	if (!Mr(e)) return;
	let t = pr(e);
	e.pointerType != "mouse" && t.canDrag && e.preventDefault();
	let n = yr(e);
	n !== t.prevStampablePointer && (t.prevStampablePointer && Pr(t, e, t.prevStampablePointer), n && Nr(t, e, n), t.prevStampablePointer = n);
}
function vr(e) {
	if (!Mr(e)) return;
	let t = pr(e);
	e.pointerType != "mouse" && t.canDrag && e.preventDefault(), t.prevStampablePointer && Pr(t, e, t.prevStampablePointer), t.prevStampablePointer = null;
}
function yr(e) {
	let t = document.elementsFromPoint(e.clientX, e.clientY);
	for (let e = 0; e < t.length; e++) {
		let n = t[e];
		if (q(n, "stampable")) return n;
	}
	let n = document.getElementsByClassName("stampable"), r = null, i = NaN;
	for (let t = 0; t < n.length; t++) {
		let a = n[t], o = a.getBoundingClientRect();
		if (o.left <= e.clientX && o.right > e.clientX && o.top <= e.clientY && o.bottom > e.clientY) {
			if (X(a, "path") && br(a, e)) return a;
			let t = o.left + o.width / 2 - e.clientX, n = o.top + o.height / 2 - e.clientY, s = t * t + n * n;
			(r == null || s < i) && (r = a, i = s);
		}
	}
	if (r) return r;
	if (e.target) {
		let t = Z(e.target, "stampable");
		if (t) return t;
	}
	return null;
}
function br(e, t) {
	let n = e.getAttribute("d");
	if (!n) return !1;
	let r = Ou(e, "svg").getBoundingClientRect(), i = document.createElement("canvas");
	i.width = r.width, i.height = r.height;
	let a = i.getContext("2d");
	if (!a) return !1;
	let o = new Path2D(n), s = t.clientX - r.left, c = t.clientY - r.top;
	return a.isPointInPath(o, s, c);
}
function xr(e) {
	let t = Z(e.target, "stampTool"), n = pr(e), r = Tr(n);
	if (t != null) {
		for (let e = 0; e < n.stampTools.length; e++) K(n.stampTools[e], "selected", !1);
		t == n.selectedTool ? n.selectedTool = null : (K(t, "selected", !0), n.selectedTool = t);
	}
	let i = W().onStampChange;
	i && i(Tr(n), r);
}
function Sr(e, t, n) {
	if (t.shiftKey || t.altKey || t.ctrlKey) for (let n = 0; n < e.stampTools.length; n++) {
		let r = e.stampTools[n].getAttributeNS("", "data-click-modifier");
		if (r != null && t.shiftKey == r.indexOf("shift") >= 0 && t.ctrlKey == r.indexOf("ctrl") >= 0 && t.altKey == r.indexOf("alt") >= 0) return e.stampTools[n];
	}
	return n ?? (e.selectedTool == null ? e.firstTool : e.selectedTool);
}
function Cr(e) {
	return e ? document.getElementById(e) : null;
}
function wr(e, t) {
	if (t) {
		let n = t.getAttributeNS("", "data-next-stamp-id");
		if (n) return document.getElementById(n);
		let r = (e.stampTools.findIndex((e, n) => e === t) + 1) % e.stampTools.length;
		return e.stampTools[r];
	}
	return e.firstTool;
}
function Tr(e) {
	return e.selectedTool == null ? "" : e.selectedTool.id || "";
}
function Er(e) {
	let t = Q(e, "data-stamp-parent");
	return t ? document.getElementById(t) : e;
}
function Dr(e, t) {
	if (t == null) return null;
	let n = Er(t), r = ku(n, "stampedObject"), i;
	if (r != null) i = Q(r, "data-stamp-id"), K(t, i, !1), n.removeChild(r), n.removeAttributeNS("", "data-stamp-id"), Fr(e);
	else if (q(t, "stampedObject")) i = t.getAttributeNS("", "data-stamp-id"), K(t, "stampedObject", !1), K(t, i, !1), t.removeAttributeNS("", "data-stamp-id"), Fr(e);
	else return null;
	return e.selectedTool && e.selectedTool.id == i ? e.eraseTool : e.selectedTool == null && i ? wr(e, Cr(i)) : null;
}
function Or(e, t, n) {
	e ||= mr(t);
	let r = Er(t), i = n.getAttributeNS("", "data-template-id"), a = n.getAttributeNS("", "data-use-template-id"), o = Q(n, "data-style"), s = Q(n, "data-unstyle");
	if (n.getAttributeNS("", "data-erase"), i) {
		let e = document.getElementById(i);
		if (e === null) throw Error("Cannot find template \"" + i + "\" for stamp " + n.id);
		if (e != null) {
			let t = e.content.cloneNode(!0);
			r.appendChild(t);
		}
		n.id && r.setAttributeNS("", "data-stamp-id", n.id);
	} else if (a) {
		let e = er(n, a);
		for (let t = 0; t < e.length; t++) r.appendChild(e[t]);
		n.id && r.setAttributeNS("", "data-stamp-id", n.id);
	}
	(o || s) && (n.id && (K(t, "stampedObject", !0), t.setAttributeNS("", "data-stamp-id", n.id)), s && bu(t, s), o && J(t, o)), Fr(e), oa(t);
	let c = W().onStamp;
	c && c(t);
}
var kr = null, Ar = null;
function jr(e, t, n) {
	let r = Dr(e, n);
	r = Sr(e, t, r), r && Or(e, n, r), Ar = r, kr = null;
}
function Mr(e) {
	return e.pointerType != "mouse" || e.buttons == 1;
}
function Nr(e, t, n) {
	kr != null && (Dr(e, n), Or(e, n, kr), kr = null);
}
function Pr(e, t, n) {
	if (n != null) {
		let e = ku(n, "stampedObject");
		if (e != null) {
			let t = Q(e, "data-stamp-id");
			kr = t ? document.getElementById(t) : null;
		} else kr = Ar;
	} else kr = null;
}
function Fr(e) {
	if (!e.extractorTool) return;
	let t = document.getElementById(e.extractedId || "extracted");
	if (t != null) {
		let n = e.container ? e.container.getElementsByClassName("stampable") : document.getElementsByClassName("stampable"), r = "";
		for (let t = 0; t < n.length; t++) {
			let i = n[t];
			if (Q(i, "data-stamp-id") == e.extractorTool.id) {
				let e = ku(i, "extract");
				e && (r += e.innerText);
			}
		}
		if (t.tagName != "INPUT") t.innerText = r;
		else {
			let e = t;
			e.value = r;
		}
	}
}
//#endregion
//#region src/straightEdge.ts
function Ir(e) {
	let t = e.getBoundingClientRect();
	return new DOMPoint(t.x + t.width / 2, t.y + t.height / 2);
}
function Lr(e, t) {
	let n = e.x - t.x, r = e.y - t.y;
	return n * n + r * r;
}
function Rr(e, t) {
	let n = e.x - t.x, r = e.y - t.y;
	return n * n + r * r;
}
function zr(e, t) {
	k = e, Gr = e + "-area", Wr = t ? k + "-fill" : null;
	let n = document.getElementsByClassName(Gr);
	for (let r = 0; r < n.length; r++) Hr(n[r]), t && Br(n[r], e);
	xa();
}
function Br(e, t) {
	let n = e.getElementsByClassName(t + "-container");
	if (n && n.length > 0) {
		let r = e.getElementsByClassName(t + "-fill-container");
		if (!r || r.length == 0) {
			let i = n[0], a = i.cloneNode(!0);
			K(a, t + "-container", !1), K(a, t + "-fill-container", !0), i.insertAdjacentElement("afterend", a), r = e.getElementsByClassName(t + "-fill-container");
		}
		let i = e.getElementsByClassName(t + "-build-container");
		if (!i || i.length == 0) {
			let e = r[0], n = e.cloneNode(!0);
			K(n, t + "-fill-container", !1), K(n, t + "-build-container", !0), e.insertAdjacentElement("afterend", n);
		}
	}
}
function Vr() {
	return k;
}
function Hr(e) {
	e.onpointermove = function(e) {
		Qr(e);
	}, e.onpointerdown = function(e) {
		$r(e);
	}, e.onpointerup = function(e) {
		ei(e);
	}, e.onclick = function(e) {
		wi(e);
	};
}
var Ur = {
	straightEdge: "straight-edge",
	wordSelect: "word-select",
	hashiBridge: "hashi-bridge"
}, k, Wr, Gr;
function Kr(e) {
	let t = Ou(e, "SVG"), n = t.getElementsByClassName(k + "-container"), r = n && n.length > 0 ? n[0] : t, i = t.getElementsByClassName(k + "-fill-container"), a = i && i.length > 0 ? i[0] : r, o = t.getElementsByClassName(k + "-build-container"), s = o && o.length > 0 ? o[0] : a, c = t.getBoundingClientRect(), l = e.getAttributeNS("", "data-max-points"), u = l ? parseInt(l) : 2, d = k == Ur.hashiBridge ? "true" : "false", f = e.getAttributeNS("", "data-can-share-vertices") || d, p = k == Ur.hashiBridge ? "false" : "true", m = e.getAttributeNS("", "data-can-cross-self") || p, h = e.getAttributeNS("", "data-max-bridges"), ee = e.getAttributeNS("", "data-bridge-gap"), te = e.getAttributeNS("", "data-hover-range"), ne = k == Ur.straightEdge ? void 0 : k == Ur.wordSelect ? "45" : "90", re = e.getAttributeNS("", "data-angle-constraints") || ne, ie = k == Ur.straightEdge ? void 0 : k == Ur.wordSelect ? "0,45,90" : "0,90", ae = e.getAttributeNS("", "data-turn-constraints") || ie, oe = e.getAttributeNS("", "data-show-open-drag"), se = re ? (re + "+0").split("+").map((e) => parseInt(e)) : void 0, ce = ae ? ae.split(",").map((e) => parseInt(e)) : void 0;
	return {
		svg: t,
		container: r,
		fillContainer: a,
		buildContainer: s,
		bounds: c,
		maxPoints: u <= 0 ? 1e4 : u,
		canShareVertices: f ? f.toLowerCase() == "true" : !1,
		canCrossSelf: m ? m.toLowerCase() == "true" : !1,
		maxBridges: h ? parseInt(h) : k == Ur.hashiBridge ? 2 : 1,
		bridgeGap: ee ? parseInt(ee) : 8,
		hoverRange: te ? parseInt(te) : oe == "false" ? Math.max(c.width, c.height) : 30,
		angleConstraints: se ? se[0] : void 0,
		angleConstraintsOffset: se ? se[1] : 0,
		turnConstraints: ce,
		showOpenDrag: oe ? oe.toLowerCase() != "false" : !0,
		evtPos: new DOMPoint(NaN, NaN),
		evtPoint: t.createSVGPoint()
	};
}
function qr(e) {
	let t = Kr(Z(e.target, Gr));
	t.evtPos = new DOMPoint(e.x, e.y), t.evtPoint = t.svg.createSVGPoint(), t.evtPoint.x = t.evtPos.x - t.bounds.left, t.evtPoint.y = t.evtPos.y - t.bounds.top;
	let n = gi(t);
	return n && (t.nearest = Yr(t, n)), t;
}
function Jr(e) {
	let t = Kr(Z(e, Gr)), n = e.getBoundingClientRect();
	t.evtPos = new DOMPoint(n.x + n.width / 2, n.y + n.height / 2), t.evtPoint = t.svg.createSVGPoint(), t.evtPoint.x = t.evtPos.x - t.bounds.left, t.evtPoint.y = t.evtPos.y - t.bounds.top;
	let r = gi(t);
	return r && (t.nearest = Yr(t, r)), t;
}
function Yr(e, t) {
	let n = {
		vertex: t,
		index: I(t, "vx"),
		group: Z(t, "vertex-g") || t,
		centerPos: Ir(t),
		centerPoint: e.svg.createSVGPoint()
	};
	return n.centerPoint.x = n.centerPos.x - e.bounds.left, n.centerPoint.y = n.centerPos.y - e.bounds.top, n;
}
var Xr = [], Zr = null, A = null, j = [];
function Qr(e) {
	let t = qr(e);
	if (!t) return;
	let n = t.nearest ? si(t.nearest.vertex) : -1;
	if (A && n >= 0) {
		n == j.length - 2 && (A.points.removeItem(n + 1), K(j[n + 1], "building", !1), j.splice(n + 1, 1));
		return;
	}
	if (A) {
		if (t.nearest || t.showOpenDrag) {
			let e = ci(t.nearest), n = A.points.length > j.length;
			e || A.points.length >= t.maxPoints ? (n && A.points.removeItem(j.length), (e || !n) && (K(j[t.maxPoints - 1], "building", !1), j.splice(j.length - 1, 1), A.points.removeItem(j.length))) : j.length < A.points.length && A.points.removeItem(A.points.length - 1);
		}
		j.length < t.maxPoints && (t.nearest && pi(t, t.nearest) ? ni(t, t.nearest) : t.showOpenDrag && ri(t));
	} else t.nearest?.group != Zr && (K(Zr, "hover", !1), K(t.nearest?.group, "hover", !0), Zr = t.nearest?.group || null);
}
function $r(e) {
	let t = qr(e);
	if (!(!t || !t.nearest)) {
		if (!t.canShareVertices && q(t.nearest.vertex, "has-line")) {
			let e = bi(t, t.nearest.index);
			if (e) {
				let n = xi(e);
				hi(e), n.length == 2 && (n[0] == t.nearest.vertex ? ti(t, Yr(t, n[1])) : ti(t, Yr(t, n[0])), ni(t, t.nearest));
				return;
			}
		}
		ti(t, t.nearest);
	}
}
function ei(e) {
	let t = qr(e);
	if (!t || !A) return;
	let n = [];
	for (let e = 0; e < j.length; e++) K(j[e], "building", !1), K(j[e], "has-line", A != null), n.push(I(j[e], "vx"));
	ai(t, "," + n.join(",") + ",");
}
function ti(e, t) {
	j = [], j.push(t.vertex), A = document.createElementNS("http://www.w3.org/2000/svg", "polyline"), K(A, k, !0), K(A, "building", !0), K(t.vertex, "building", !0), A.points.appendItem(t.centerPoint), e.buildContainer.appendChild(A), K(Zr, "hover", !1), Zr = null;
}
function ni(e, t) {
	j.push(t.vertex), A?.points.appendItem(t.centerPoint), K(A, "open-ended", !1), K(t.vertex, "building", !0);
}
function ri(e) {
	K(A, "open-ended", !0), A?.points.appendItem(e.evtPoint);
}
function ii(e, t) {
	let n = e.split(",").map((e) => parseInt(e));
	if (n.length > 2 && n[1] > n[n.length - 2]) {
		if (t) {
			let e = [];
			for (let n = t.points.length - 1; n >= 0; n--) e.push(t.points[n]);
			t.points.clear();
			for (let n = 0; n < e.length; n++) t.points.appendItem(e[n]);
		}
		return n.map((e) => isNaN(e) ? "" : String(e)).reverse().join(",");
	}
	return e;
}
function ai(e, t, n = !0) {
	if (!A) return;
	if (j.length < 2) {
		e.buildContainer.removeChild(A), A = null;
		return;
	} else A.points.length > j.length && (A.points.removeItem(j.length), K(A, "open-ended", !1));
	t = ii(t, A);
	let r = mi(e, "data-vertices", t, k, []);
	if (r.length >= e.maxBridges && A && (e.buildContainer.removeChild(A), A = null), A) {
		if (e.buildContainer.removeChild(A), K(A, "building", !1), e.container.appendChild(A), A.setAttributeNS("", "data-vertices", t), Xr.push(A), Wr) {
			let t = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
			K(t, Wr, !0);
			for (let e = 0; e < A.points.length; e++) t.points.appendItem(A.points[e]);
			e.fillContainer.appendChild(t);
		}
		if (r.push(A), r.length > 1) for (let t = 0; t < r.length; t++) {
			let n = r.length == 1 ? 0 : r.length % 2 == 0 ? e.bridgeGap / 2 * (t * 2 - (r.length - 1)) : e.bridgeGap * (t - Math.floor(r.length / 2));
			oi(e, r[t], n);
		}
		n && ca(t, !0);
	}
	j = [], A = null;
}
function oi(e, t, n) {
	if (t.points.length < 2) return;
	let r = t.getAttributeNS("", "points") || "", i = t.points[0], a = t.points[t.points.length - 1], o = {
		x: i.y - a.y,
		y: a.x - i.x
	}, s = Math.sqrt(o.x * o.x + o.y * o.y);
	if (o.x /= s, o.y /= s, t.points.clear(), t.points.appendItem(i), n != 0) {
		let r = e.svg.createSVGPoint(), s = e.svg.createSVGPoint();
		r.x = i.x + o.x * n, r.y = i.y + o.y * n, s.x = a.x + o.x * n, s.y = a.y + o.y * n, t.points.appendItem(r), t.points.appendItem(s);
	}
	if (t.points.appendItem(a), Wr) {
		let n = mi(e, "points", r, Wr, []);
		n.length > 0 && n[0].setAttributeNS("", "points", t.getAttributeNS("", "points") || "");
	}
}
function si(e) {
	if (!j || !e) return -1;
	for (let t = 0; t < j.length; t++) if (j[t] == e) return t;
	return -1;
}
function ci(e) {
	if (!e || !A || j.length < 2) return !1;
	let t = A.points[j.length - 1], n = A.points[j.length - 2], r = Math.atan2(t.y - n.y, t.x - n.x), i = Math.atan2(e.centerPoint.y - n.y, e.centerPoint.x - n.x) - r;
	return Math.abs(i * 180 / Math.PI) < 1;
}
function li(e, t, n) {
	return (n.y - e.y) * (t.x - e.x) > (t.y - e.y) * (n.x - e.x);
}
function ui(e, t, n) {
	if (e == t || e == n) return !0;
	if (t.x == n.x) return e.x == t.x && e.y >= Math.min(t.y, n.y) && e.y <= Math.max(t.y, n.y);
	if (t.y == n.y) return e.y == t.y && e.x >= Math.min(t.x, n.x) && e.x <= Math.max(t.x, n.x);
	let r = n.x - t.x, i = n.y - t.y, a = e.x - t.x, o = e.y - t.y, s = a / r, c = o / i;
	return s == c && s > 0 && c < 1;
}
function di(e, t, n, r) {
	return li(e, n, r) != li(t, n, r) && li(e, t, n) != li(e, t, r) || ui(n, e, t) || ui(r, e, t) || ui(e, n, r) || ui(t, n, r);
}
function fi(e, t) {
	if (t.length <= 1) return !1;
	let n = t[t.length - 1];
	for (let r = 1; r < t.length - 1; r++) if (di(n, e, t[r - 1], t[r])) return di(n, e, t[r - 1], t[r]), !0;
	return !1;
}
function pi(e, t) {
	if (!A || j.length < 1 || !e.canCrossSelf && fi(t.centerPoint, A.points)) return !1;
	let n = Yr(e, j[j.length - 1]), r = t.centerPos.x - n.centerPos.x, i = t.centerPos.y - n.centerPos.y;
	if (Math.abs(r) <= 1 && Math.abs(i) <= 1) return !1;
	if (e.angleConstraints == null) return !0;
	let a = Math.atan2(i, r) * 180 / Math.PI + 360, o = Math.abs((a + e.angleConstraintsOffset) % e.angleConstraints);
	if (o > e.angleConstraints / 2 && (o = e.angleConstraints - o), o >= 1) return !1;
	if (e.turnConstraints !== void 0 && j.length >= 2) {
		let t = Yr(e, j[j.length - 2]), r = n.centerPos.x - t.centerPos.x, i = n.centerPos.y - t.centerPos.y;
		if (Math.abs(r) <= 1 && Math.abs(i) <= 1) return !1;
		let o = Math.abs(Math.atan2(i, r) * 180 / Math.PI + 360 - a);
		o = Math.min(o, 360 - o);
		for (let t = 0; t < e.turnConstraints.length; t++) if (Math.abs(o - e.turnConstraints[t]) < 1) return !0;
		return !1;
	}
	return !0;
}
function mi(e, t, n, r, i) {
	let a = e.svg.getElementsByClassName(r);
	for (let e = 0; e < a.length; e++) {
		let r = a[e];
		r.getAttributeNS("", t) === n && i.push(r);
	}
	return i;
}
function hi(e) {
	let t = Kr(Z(e, Gr));
	for (let t = 0; t < Xr.length; t++) if (Xr[t] === e) {
		Xr.splice(t, 1);
		break;
	}
	let n = [], r = e.getAttributeNS("", "points");
	r && (n = mi(t, "points", r, k, []), Wr && (n = mi(t, "points", r, Wr, n)));
	let i = "";
	for (let e = 0; e < n.length; e++) {
		let t = n[e];
		i || (i = t.getAttributeNS("", "data-vertices") || "", i && ca(i, !1)), t.parentNode?.removeChild(t);
	}
	if (n = mi(t, "data-vertices", i, k, []), n.length >= 1) for (let e = 0; e < n.length; e++) {
		let r = n.length == 1 ? 0 : n.length % 2 == 0 ? t.bridgeGap / 2 * (e * 2 - (n.length - 1)) : t.bridgeGap * (e - Math.floor(n.length / 2));
		oi(t, n[e], r);
	}
}
function gi(e) {
	let t = e.hoverRange * e.hoverRange, n = e.svg.getElementsByClassName("vertex"), r = null;
	for (let i = 0; i < n.length; i++) {
		let a = n[i], o = Rr(Ir(a), e.evtPos);
		(t < 0 || o < t) && (t = o, r = a);
	}
	return r;
}
function _i(e, t) {
	return Math.sqrt((e.x - t.x) * (e.x - t.x) + (e.y - t.y) * (e.y - t.y));
}
function vi(e, t) {
	let n = {
		distance: NaN,
		ptOnLine: {
			x: NaN,
			y: NaN
		},
		fractionAlongLine: NaN
	};
	if (!e.points || e.points.length < 2) return n;
	let r = e.points[0], i = e.points[e.points.length - 1], a = i.y - r.y, o = i.x - r.x, s = {
		a,
		b: -o,
		c: -(a * r.x - o * r.y)
	}, c = Math.sqrt(a * a + o * o);
	a == 0 ? n.distance = Math.abs(t.y - r.y) : o == 0 ? n.distance = Math.abs(t.x - r.x) : n.distance = Math.abs(s.a * t.x + s.b * t.y + s.c) / c;
	let l = a / c, u = -o / c, d = {
		x: t.x + l * n.distance,
		y: t.y + u * n.distance
	}, f = {
		x: t.x - l * n.distance,
		y: t.y - u * n.distance
	};
	return n.ptOnLine = Math.abs(s.a * d.x + s.b * d.y + s.c) < Math.abs(s.a * f.x + s.b * f.y + s.c) ? d : f, n.fractionAlongLine = s.b == 0 ? (n.ptOnLine.y - r.y) / s.a : (n.ptOnLine.x - r.x) / -s.b, n.fractionAlongLine < 0 ? n.distance = _i(t, r) : n.fractionAlongLine > 1 && (n.distance = _i(t, i)), n;
}
function yi(e) {
	let t = e.hoverRange, n = e.svg.getElementsByClassName(k), r = null;
	for (let i = 0; i < n.length; i++) {
		let a = n[i], o = vi(a, e.evtPoint);
		o.distance < t && o.fractionAlongLine > .1 && o.fractionAlongLine < .9 && (t = o.distance, r = a);
	}
	return r;
}
function bi(e, t) {
	let n = "," + String(t) + ",", r = e.svg.getElementsByClassName(k);
	for (let e = 0; e < r.length; e++) {
		let t = r[e], i = t.getAttributeNS("", "data-vertices");
		if (i && i.search(n) >= 0) return t;
	}
	return null;
}
function xi(e) {
	let t = e.getAttributeNS("", "data-vertices"), n = [], r = t?.split(",").map((e) => parseInt(e));
	if (r) {
		let e = ma("vertex", "vx");
		for (let t = 0; t < r.length; t++) if (r[t]) {
			let i = e[r[t]];
			n.push(i);
		}
	}
	return n;
}
function Si(e) {
	let t = ma("vertex", "vx"), n = e.split(","), r = null;
	for (let e = 0; e < n.length; e++) if (n[e].length > 0) {
		let i = t[parseInt(n[e])];
		i && (r == null ? (r = Jr(i), ti(r, r.nearest)) : ni(r, Yr(r, i)), K(i, "building", !1));
	}
	r && ai(r, e, !1);
}
function Ci(e) {
	let t = document.getElementById(e);
	if (!t) return;
	let n = t.getElementsByClassName(k);
	for (let e = n.length - 1; e >= 0; e--) {
		let t = n[e];
		t.parentNode?.removeChild(t);
	}
	let r = t.getElementsByClassName("vertex");
	for (let e = 0; e < j.length; e++) K(r[e], "building", !1), K(r[e], "has-line", !1);
	j = [], A = null;
}
function wi(e) {
	let t = qr(e);
	if (!t.nearest) {
		let e = yi(t);
		e && hi(e);
	}
}
//#endregion
//#region src/scratch.ts
var M = void 0, N = void 0;
function Ti() {
	let e = document.getElementById("page") || document.getElementsByClassName("printedPage")[0];
	e && (M = document.createElement("div"), M.id = "scratch-pad", M.addEventListener("click", function(e) {
		Di(e);
	}), e.addEventListener("click", function(e) {
		Oi(e);
	}), window.addEventListener("blur", function(e) {
		Ni(null);
	}), e.insertAdjacentElement("afterbegin", M), w() && U(w()?.cssRoot + "ScratchPad.css"));
}
function Ei(e) {
	if (!M) return;
	if (N && N !== e.target && Ni(e), e.target && q(e.target, "scratch-div")) {
		Fi(e.target);
		return;
	}
	if (!e.ctrlKey) return;
	let t = M.getBoundingClientRect(), n = document.createElement("div");
	K(n, "scratch-div", !0), N = document.createElement("textarea"), n.style.left = e.clientX - t.left - 5 + "px", n.style.top = e.clientY - t.top - 10 + "px", N.style.width = Math.min(t.right - e.clientX, t.width / 3) + "px", Ai(N), N.title = "Escape to exit note mode", N.onkeyup = function(e) {
		ji(e);
	}, K(M, "topmost", !0), n.appendChild(N), Bi(n), M.appendChild(n), N.focus();
}
function Di(e) {
	e.ctrlKey || ki(e.clientX, e.clientY) != N && Ni(e);
}
function Oi(e) {
	if (e.ctrlKey) {
		Ni(e);
		let n = document.elementsFromPoint(e.clientX, e.clientY), r = !1;
		var t = ki(e.clientX, e.clientY);
		if (t && t != N) {
			Fi(t);
			return;
		}
		for (let e = 0; e < n.length; e++) {
			let t = n[e];
			if (q(t, "scratch-div")) {
				Fi(t);
				return;
			}
			if (q(t, "scratch-drag-handle")) return;
			if (t.id === "scratch-pad") {
				r = !0;
				continue;
			}
			if (X(t, "a") && r) {
				t.click();
				return;
			}
			if (X(t, [
				"input",
				"textarea",
				"select",
				"a"
			]) || !q(t, "cross-off") && t.id != "page" && t.onclick) return;
		}
		Ei(e);
	}
}
function ki(e, t) {
	if (N) {
		var n = N.getBoundingClientRect();
		if (e >= n.left && e <= n.right && t >= n.top && t <= n.bottom) return N;
	}
	for (var r = document.getElementsByClassName("scratch-div"), i = 0; i < r.length; i++) {
		var a = r[i], n = a.getBoundingClientRect();
		if (e >= n.left && e <= n.right && t >= n.top && t <= n.bottom) return a;
	}
	return null;
}
function Ai(e) {
	e.setAttribute("spellcheck", "false"), e.setAttribute("autocomplete", "off"), e.setAttribute("autocorrect", "off"), e.setAttribute("autocapitalize", "off");
}
function ji(e) {
	if (e.target) {
		if (e.code == "Escape") {
			Ni(null);
			return;
		}
		Mi(e.target);
	}
}
function Mi(e) {
	let t = 1 + (e.value || "").split("\n").length;
	e.setAttributeNS("", "rows", t.toString());
}
function Ni(e) {
	if (!M || !N) return;
	let t = N.parentNode;
	if (e && t.contains(e.target)) return;
	K(M, "topmost", !1);
	let n = N, r = n.value.trimEnd();
	N = void 0;
	let i = t.getElementsByClassName("scratch-drag-handle")[0];
	if (i && t.removeChild(i), r) {
		let e = n.getBoundingClientRect();
		Ri(r, t);
		let i = parseInt(n.style.width);
		t.style.maxWidth = i + "px", t.style.maxHeight = e.height + "px", t.removeChild(n), K(t, "hydrated", !1);
	} else t.parentNode?.removeChild(t);
	M.removeEventListener("dragover", zi), ua(M);
}
function Pi(e) {
	let t = "";
	for (let n = 0; n < e.childNodes.length; n++) {
		let r = e.childNodes[n];
		r.nodeType == Node.TEXT_NODE ? (t += r.textContent, t = t.replaceAll(" Â\xA0", "  ")) : r.nodeType == Node.ELEMENT_NODE && X(r, "br") ? t += "\n" : r.nodeType == Node.ELEMENT_NODE && X(r, "img") || console.error("Unexpected contents of a scratch-div: " + r);
	}
	return t;
}
function Fi(e) {
	if (!M || !q(e, "scratch-div")) return;
	K(e, "hydrated", !0);
	let t = document.createElement("textarea");
	t.value = Pi(e), t.addEventListener("blur", function(e) {
		Ni(e);
	});
	let n = M.getBoundingClientRect(), r = e.getBoundingClientRect();
	for (t.style.width = Math.min(n.width / 3, n.right - r.left) + "px", Ai(t), t.title = "Escape to exit note mode", Mi(t), t.onkeyup = function(e) {
		ji(e);
	}, K(M, "topmost", !0); e.childNodes.length > 0;) e.removeChild(e.childNodes[0]);
	e.appendChild(t), Bi(e), N = t, t.focus();
}
function Ii() {
	if (!M) return;
	N &&= (N.parentNode.removeChild(N), void 0);
	let e = M.getElementsByClassName("scratch-div");
	for (let t = e.length - 1; t >= 0; t--) M.removeChild(e[t]);
}
function Li(e, t, n, r, i) {
	if (M && i) {
		let a = document.createElement("div");
		K(a, "scratch-div", !0), Ri(i, a), a.style.left = e + "px", a.style.top = t + "px", a.style.maxWidth = n + "px", a.style.maxHeight = r + "px", K(a, "hydrated", !0), M.append(a);
	}
}
function Ri(e, t) {
	let n = e.split("\n");
	for (let e = 0; e < n.length; e++) {
		e > 0 && t.appendChild(document.createElement("br"));
		let r = n[e].replaceAll("  ", " Â\xA0");
		t.appendChild(document.createTextNode(r));
	}
}
var zi = (e) => {
	e.preventDefault();
};
function Bi(e) {
	let t = document.createElement("img");
	t.src = "../Icons/ScratchMove.png", K(t, "scratch-drag-handle", !0), e.appendChild(t);
	let n = (e) => c(e);
	e.setAttribute("draggable", "true"), e.addEventListener("dragstart", s), e.addEventListener("dragend", l), M.addEventListener("dragover", zi);
	let r = 0, i = 0, a = 0, o = 0;
	function s(t) {
		r != 0 && console.error("Re-entrant drag!!"), K(e, "dragging", !0), r = t.clientX, i = t.clientY, a = parseFloat(e.style.left), o = parseFloat(e.style.top), M.addEventListener("drop", n), t.dataTransfer && (t.dataTransfer.effectAllowed = "move");
	}
	function c(t) {
		let n = t.clientX - r, s = t.clientY - i;
		e.style.left = a + n + "px", e.style.top = o + s + "px", r = 0, i = 0, N?.focus();
	}
	function l(t) {
		K(e, "dragging", !1), M.removeEventListener("drop", n);
	}
}
//#endregion
//#region src/storage.ts
var P = {
	letters: {},
	words: {},
	notes: {},
	checks: {},
	containers: {},
	positions: {},
	stamps: {},
	highlights: {},
	controls: {},
	scratch: {},
	edges: [],
	guesses: [],
	usage: void 0,
	time: null
}, Vi = !0, Hi = null;
function Ui() {
	return window.location.origin + window.location.pathname;
}
function Wi() {
	let e = Ui();
	if (!rl() && !sl() && e in localStorage) {
		let t = localStorage.getItem(e);
		if (t != null) {
			try {
				Hi = Gi(t);
			} catch {
				Hi = {};
			}
			let e = !0;
			for (let t in Hi) if (Hi[t] != null && Hi[t] != "") {
				e = !1;
				break;
			}
			if (!e) {
				let e = cl();
				e === void 0 ? Yi(Hi.time) : e ? Zi(!1) : Qi(!1);
			}
		}
	}
}
function Gi(e, t = !0) {
	try {
		return JSON.parse(e);
	} catch (e) {
		return t && console.error(e), null;
	}
}
var Ki, qi, Ji;
function Yi(e) {
	Ki = document.createElement("div"), Ki.id = "reloadLocalStorage";
	let t = null;
	w().icon && (t = document.createElement("img"), t.classList.add("icon"), t.src = w().icon);
	let n = document.createElement("span");
	n.classList.add("title-font"), n.innerText = document.title;
	let r = document.createElement("p");
	r.appendChild(document.createTextNode("Would you like to reload auto-saved progress on ")), r.appendChild(n), r.appendChild(document.createTextNode(" from earlier?"));
	let i = /* @__PURE__ */ new Date(), a = new Date(e), o = i.getTime() - a.getTime(), s = Math.ceil(o / 1e3), c = Math.floor(s / 60), l = Math.floor(c / 60), u = Math.floor(l / 24), d = "The last change was ";
	u >= 2 ? d += u + " days ago." : l >= 2 ? d += l + " hours ago." : c >= 2 ? d += c + " minutes ago." : d += s + " seconds ago.";
	var f = document.createElement("p");
	f.innerText = d, qi = document.createElement("button"), qi.innerText = "Reload", qi.onclick = function() {
		Zi(!0);
	}, qi.onkeydown = function(e) {
		Xi(e);
	}, Ji = document.createElement("button"), Ji.innerText = "Start over", Ji.onclick = function() {
		Qi(!0);
	}, Ji.onkeydown = function(e) {
		Xi(e);
	};
	var p = document.createElement("p");
	p.appendChild(qi), p.appendChild(Ji), t && Ki.appendChild(t), Ki.appendChild(r), Ki.appendChild(f), Ki.appendChild(p);
	var m = document.getElementById("page");
	m == null ? confirm("Continue where you left off?") ? Zi(!1) : Qi(!1) : (m.appendChild(Ki), qi.focus());
}
function Xi(e) {
	e.code == "Escape" ? Qi(!0) : e.code.search("Arrow") == 0 && (e.target == qi ? Ji.focus() : qi.focus());
}
function Zi(e) {
	e && (Ki.style.display = "none"), Ca(Hi);
}
function Qi(e) {
	e && (Ki.style.display = "none"), Hi = null, localStorage.removeItem(Ui());
}
function F(e) {
	!Sa && Vi && (P.time = /* @__PURE__ */ new Date(), localStorage.setItem(Ui(), JSON.stringify(P)), e && !$i() && Zt(Vt.Edit));
}
function $i() {
	return !(Object.values(P.letters).find((e) => e != "") != null || Object.values(P.words).find((e) => e != "") != null || Object.values(P.positions).length > 0 || Object.keys(P.stamps).length > 0 || P.edges.length > 0 || Object.keys(P.scratch).length > 0 || Object.values(P.checks).find((e) => e === !0));
}
function ea(e) {
	if (e && e != wa) {
		var t = I(e);
		t >= 0 && (P.letters[t] = e.value, F(!0));
	}
}
function ta(e) {
	if (e && e != wa) {
		var t = I(e);
		t >= 0 && (P.words[t] = e.value, F(!0));
	}
}
function na(e) {
	if (e) {
		var t = I(e);
		t >= 0 && (P.notes[t] = e.value, F(!0));
	}
}
function ra(e, t) {
	if (e) {
		var n = I(e);
		n >= 0 && (P.checks[n] = t, F(!0));
	}
}
function ia(e, t) {
	if (e && t) {
		var n = I(e), r = I(t);
		n >= 0 && r >= 0 && (P.containers[n] = r, F(!0));
	}
}
function aa(t) {
	if (t) {
		var n = I(t);
		if (n >= 0) {
			var r = e(t);
			P.positions[n] = r, F(!0);
		}
	}
}
function oa(e) {
	if (e) {
		var t = I(e);
		if (t >= 0) {
			let n = Er(e).getAttributeNS("", "data-stamp-id");
			n ? P.stamps[t] = n : delete P.stamps[t], F(!0);
		}
	}
}
function sa(e) {
	if (e) {
		var t = I(e, "ch");
		t >= 0 && (P.highlights[t] = q(e, "highlighted"), F(!0));
	}
}
function ca(e, t) {
	if (t) P.edges.push(e);
	else {
		let t = P.edges.indexOf(e);
		t >= 0 && P.edges.splice(t, 1);
	}
	F(!0);
}
function la(e) {
	P.guesses = e, F(!1);
}
function ua(e) {
	let t = {}, n = e.getBoundingClientRect(), r = e.getElementsByClassName("scratch-div");
	for (let e = 0; e < r.length; e++) {
		let i = r[e], a = i.getBoundingClientRect(), o = [
			Math.ceil(a.left - n.left),
			Math.ceil(a.top - n.top),
			a.width,
			a.height
		].join(",");
		t[o] = Pi(i);
	}
	P.scratch = t, F(!0);
}
function da() {
	let e = {}, t = document.getElementsByClassName("save-state");
	for (let n = 0; n < t.length; n++) {
		let r = t[n], i = r.id;
		if (i) {
			let t = Q(r, "data-save-state");
			if (!t && X(r, [
				"input",
				"select",
				"textarea",
				"button"
			])) {
				let t = r.value;
				t && (e[i] = t);
			} else if (t == "class") {
				let t = [];
				r.classList.forEach((e, n) => t.push(e)), t.length > 0 && (e[i] = t.join(" "));
			} else if (t) {
				let n = r.getAttributeNS("", t);
				n && (e[i] = n);
			}
		}
	}
	Object.keys(e).length > 0 && (P.controls = e, F(!0));
}
function fa(e, t, n) {
	let r = "data-globalIndex";
	t != null && (r += "-" + t), n ||= 0;
	for (let t = 0; t < e.length; t++) e[t].setAttributeNS("", r, String(t));
}
function I(e, t) {
	if (e) {
		let n = "data-globalIndex";
		t != null && (n += "-" + t);
		let r = e.getAttributeNS("", n);
		if (r) return Number(r);
	}
	return -1;
}
function pa(e, t, n) {
	let r = document.getElementsByClassName(e);
	for (let e = 0; e < r.length; e++) {
		let i = r[e];
		if (t == I(i, n)) return i;
	}
	return null;
}
function ma(e, t) {
	let n = {}, r = document.getElementsByClassName(e);
	for (let e = 0; e < r.length; e++) {
		let i = I(r[e], t);
		i >= 0 && (n[i] = r[e]);
	}
	return n;
}
function ha() {
	let e = document.getElementsByClassName("letter-input");
	fa(e), e = document.getElementsByClassName("word-input"), fa(e);
}
function ga() {
	fa(document.getElementsByClassName("note-input"));
}
function _a() {
	fa(document.getElementsByClassName("cross-off"));
}
function va() {
	let e = document.getElementsByClassName("moveable");
	fa(e), e = document.getElementsByClassName("drop-target"), fa(e);
}
function ya() {
	fa(document.getElementsByClassName("stampable"));
}
function ba() {
	fa(document.getElementsByClassName("can-highlight"), "ch");
}
function xa() {
	fa(document.getElementsByClassName("vertex"), "vx");
}
var Sa = !1;
function Ca(e) {
	Sa = !0, Ta(e.letters), Ea(e.words), Da(e.notes), Oa(e.checks), ka(e.containers), Aa(e.positions), ja(e.stamps), Ma(e.highlights), Na(e.edges), Pa(e.guesses), Fa(e.scratch), Ia(e.controls), Sa = !1;
	let t = W().onRestore;
	t && t();
}
var wa = null;
function Ta(e) {
	P.letters = e;
	var t = document.getElementsByClassName("letter-input");
	for (let i = 0; i < t.length; i++) {
		wa = t[i];
		var n = t[i], r = e[i];
		r != null && (n.value = r, Ao(n, e[i]));
	}
	wa = null;
}
function Ea(e) {
	P.words = e;
	var t = document.getElementsByClassName("word-input");
	for (let a = 0; a < t.length; a++) {
		wa = t[a];
		var n = t[a], r = e[a];
		if (r != null) {
			n.value = r, r.length > 0 && Ao(n, r.substring(r.length - 1));
			var i = Q(n, "data-extracted-id", void 0, "extracted-");
			i != null && Wo(i);
		}
	}
	wa = null, t.length > 0 && Wo(null);
}
function Da(e) {
	P.notes = e;
	var t = document.getElementsByClassName("note-input");
	for (let i = 0; i < t.length; i++) {
		var n = t[i], r = e[I(n)];
		r != null && (n.value = r);
	}
}
function Oa(e) {
	P.checks = e;
	let t = document.getElementsByClassName("cross-off");
	for (let n = 0; n < t.length; n++) {
		let r = t[n], i = e[I(r)];
		i != null && K(r, "crossed-off", i);
	}
}
function ka(e) {
	P.containers = e, document.getElementsByClassName("moveable"), document.getElementsByClassName("drop-target");
	let t = [];
	for (let n in e) t[parseInt(n)] = e[n];
	for (let e in t) {
		let n = pa("moveable", parseInt(e)), r = pa("drop-target", t[e]);
		n && r && se(n, r);
	}
}
function Aa(e) {
	P.positions = e;
	var t = document.getElementsByClassName("moveable");
	for (let r = 0; r < t.length; r++) {
		var n = e[r];
		n != null && ce(t[r], n);
	}
}
function ja(e) {
	P.stamps = e;
	var t = document.getElementsByClassName("stampable");
	for (let r = 0; r < t.length; r++) {
		var n = e[r];
		if (n != null) {
			let e = document.getElementById(n);
			e && Or(void 0, t[r], e);
		}
	}
}
function Ma(e) {
	P.highlights = e ?? {};
	var t = document.getElementsByClassName("can-highlight");
	for (let i = 0; i < t.length; i++) {
		var n = t[i], r = e[I(n, "ch")];
		r != null && K(n, "highlighted", r);
	}
}
function Na(e) {
	e ||= [], P.edges = e;
	for (let t = 0; t < e.length; t++) Si(e[t]);
}
function Pa(e) {
	e ||= [];
	for (let t = 0; t < e.length; t++) {
		let n = e[t];
		Pn({
			field: n.field,
			guess: n.guess,
			time: new Date(String(n.time))
		});
	}
}
function Fa(e) {
	P.scratch = e, Ii();
	let t = Object.keys(e);
	for (let n = 0; n < t.length; n++) {
		let r = t[n], i = r.split(",").map((e) => parseInt(e)), a = e[r];
		Li(i[0], i[1], i[2], i[3], a);
	}
}
function Ia(e) {
	P.controls = e;
	let t = document.getElementsByClassName("save-state");
	for (let n = 0; n < t.length; n++) {
		let r = t[n], i = r.id;
		if (i && e[i] !== void 0) {
			let t = Q(r, "data-save-state");
			if (!t && X(r, [
				"input",
				"select",
				"textarea",
				"button"
			])) r.value = e[i];
			else if (t === "class") {
				bu(r, yu(r).filter((e) => e !== "save-state"));
				let t = e[i].split(" ");
				for (let e = 0; e < t.length; e++) K(r, t[e], !0);
			} else if (t) r.setAttributeNS("", t, e[i]);
			else continue;
			let n = new Event("load");
			r.dispatchEvent(n);
		}
	}
}
var La = {
	Hidden: "hidden",
	Locked: "locked",
	Unlocked: "unlocked",
	Loaded: "loaded",
	Solved: "solved"
};
function Ra(e, t, n) {
	e ||= Ga();
	let r = 0;
	for (n ||= "puzzle_list"; n.startsWith("../");) n = n.substring(3), r += 1;
	let i = Ka(n, r), a = {};
	if (i in localStorage) {
		let e = localStorage.getItem(i);
		e && (a = Gi(e));
	}
	a ||= {};
	let o = a[e];
	return a[e] = t, localStorage.setItem(i, JSON.stringify(a)), t !== o;
}
function za(e, t, n) {
	e ||= Ga();
	let r = 0;
	for (n ||= "puzzle_list"; n.startsWith("../");) n = n.substring(3), r += 1;
	let i = Ka(n, r), a = {};
	if (i in localStorage) {
		let t = localStorage.getItem(i);
		if (t && (a = Gi(t), a && e in a)) return a[e];
	}
	return t;
}
function Ba(e) {
	let t = [];
	var n = Ka("puzzle_list", 0);
	if (n in localStorage) {
		let r = localStorage.getItem(n);
		if (r) {
			let n = Gi(r);
			if (n) {
				let r = Object.keys(n);
				for (let i = 0; i < r.length; i++) {
					let a = r[i];
					n[a] === e && t.push(a);
				}
			}
		}
	}
	return t;
}
function Va() {
	var e = Ka("puzzle_list", 0);
	localStorage.setItem(e, JSON.stringify(null));
}
function Ha(e) {
	var t = Ka(e, 0);
	localStorage.setItem(t, JSON.stringify(null));
}
function Ua(e, t, n) {
	return Wa(Ka(e, t) + "-" + n);
}
function Wa(e) {
	if (e in localStorage) {
		let t = localStorage.getItem(e);
		if (t) return Gi(t);
	}
}
function Ga(e = !0) {
	let t = window.location.pathname, n = t.lastIndexOf("\\"), r = t.lastIndexOf("/"), i = t.split(r >= n ? "/" : "\\"), a = i[i.length - 1];
	if (e) {
		let e = a.split(".");
		e.length > 1 && (a = a.substring(0, a.length - 1 - e[e.length - 1].length));
	}
	return a;
}
function Ka(e, t, n) {
	let r = Ui(), i = r.lastIndexOf("\\"), a = r.lastIndexOf("/"), o = "/";
	(a < 0 || i > a) && (o = "\\"), t ? t += 1 : t = 1;
	var s = r.split(o);
	return s.splice(s.length - t, t, e), n && s.splice(0, s.length - n), s.join(o);
}
function qa(e) {
	if (!e) {
		let e = localStorage.length;
		return localStorage.clear(), e;
	}
	let t = 0, n = Object.keys(localStorage);
	for (let r = 0; r < n.length; r++) n[r].indexOf(e) == 0 && (localStorage.removeItem(n[r]), t++);
	return t;
}
function Ja(e) {
	if (!e) return null;
	let t = Ka("login-" + e, 0), n = localStorage.getItem(t);
	if (n) {
		let e = Gi(n);
		if (e && e.player) return e;
	}
	return null;
}
function Ya(e, t) {
	if (e) {
		let n = Ka("login-" + e, 0);
		t ? localStorage.setItem(n, JSON.stringify(t)) : localStorage.removeItem(n);
	}
}
//#endregion
//#region src/notes.ts
function Xa(e) {
	let t = 0;
	t = Za("notes-above", "note-above", t), t = Za("notes-below", "note-below", t), t = Za("notes-right", "note-right", t), t = Za("notes-left", "note-left", t), t = Za("notes", void 0, t), t = Za("notes-abs", void 0, t), ro(e), ga(), il() ? no(L.Disabled) : nl() && no(L.Visible);
}
function Za(e, t, n) {
	var r = document.getElementsByClassName(e);
	for (let e = 0; e < r.length; e++) {
		let n = r[e], i = document.createElement("input");
		i.type = "text", i.classList.add("note-input"), q(n, "numeric") && (i.pattern = "[0-9]*", i.inputMode = "numeric"), t != null && i.classList.add(t), i.onkeyup = function(e) {
			Qa(e);
		}, i.onchange = function(e) {
			$a(e);
		}, n.appendChild(i);
	}
	return n;
}
function Qa(e) {
	if (e.isComposing || e.currentTarget == null) return;
	let t = e.currentTarget, n = e.code;
	if (n == "Enter" && (n = e.shiftKey ? "ArrowUp" : "ArrowDown"), n == "ArrowUp" || n == "PageUp") {
		$(Y(t, "note-input", void 0, -1));
		return;
	} else if (n == "Enter" || n == "ArrowDown" || n == "PageDown") {
		$(Y(t, "note-input"));
		return;
	}
	eo(t);
}
function $a(e) {
	if (e.target == null || e.type == "KeyboardEvent" && e.isComposing) return;
	let t = e.currentTarget, n = Z(t, "note-input");
	na(n), eo(n);
}
function eo(e) {
	let t = W().onNoteChange;
	t && t(e);
}
var L = {
	Disabled: -1,
	Unmarked: 0,
	Visible: 1,
	Subdued: 2,
	MOD: 3
};
function to() {
	var e = document.getElementsByTagName("body")[0];
	return q(e, "show-notes") ? L.Visible : q(e, "enable-notes") ? L.Subdued : q(e, "disabled-notes") ? L.Disabled : L.Unmarked;
}
function no(e) {
	var t = document.getElementsByTagName("body")[0];
	K(t, "show-notes", e == L.Visible), K(t, "enable-notes", e == L.Subdued), K(t, "disable-notes", e == L.Disabled);
}
function ro(e) {
	let t = document.getElementById("notes-toggle");
	t == null && e != null && (t = document.createElement("a"), t.id = "notes-toggle", e.appendChild(t));
	let n = to();
	n == L.Disabled || n == L.Unmarked ? t.innerText = "Show Notes" : n == L.Visible ? t.innerText = "Dim Notes" : t.innerText = "Un-mark Notes", t.href = "javascript:toggleNotes()";
}
function io() {
	no((to() + 1) % L.MOD), ro(null);
}
function ao() {
	let e = document.getElementsByClassName("cross-off");
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		r.onclick = function(e) {
			oo(e);
		};
		var t = document.createElement("span");
		t.classList.add("check"), r.appendChild(t);
	}
	_a();
}
function oo(e) {
	if (e.ctrlKey || e.shiftKey || e.altKey) return;
	let t = e.target;
	if (t.tagName == "A" || q(t, "note-input") || q(t, "letter-input") || q(t, "word-input")) return;
	let n = Z(t, "cross-off");
	if (n != null) {
		let e = !q(n, "crossed-off");
		K(n, "crossed-off", e), ra(n, e);
	}
}
function so() {
	let e = document.getElementById("highlight-ability");
	e != null && (e.onmousedown = function() {
		co();
	});
	let t = document.getElementsByClassName("highlight-container");
	for (let e = 0; e < t.length; e++) {
		let n = t[e], r = Q(n, "data-highlight-rules");
		if (r) {
			let e = r.split(" ");
			for (let t = 0; t < e.length; t++) {
				let r = e[t];
				if (r[0] == ".") {
					let e = n.getElementsByClassName(r.substring(1));
					for (let t = 0; t < e.length; t++) K(e[t], "can-highlight", !0);
				} else if (r[0] == "#") K(document.getElementById(r.substring(1)), "can-highlight", !0);
				else {
					let e = n.getElementsByTagName(r.toLowerCase());
					for (let t = 0; t < e.length; t++) K(e[t], "can-highlight", !0);
				}
			}
		}
	}
	let n = document.getElementsByClassName("can-highlight");
	for (let e = 0; e < n.length; e++) {
		let t = n[e];
		t.onclick = function(e) {
			lo(e);
		};
	}
	ba();
}
function co(e) {
	e ??= document.activeElement;
	let t = Z(e, "can-highlight");
	t && (K(t, "highlighted"), sa(t));
}
function lo(e) {
	let t = document.elementFromPoint(e.clientX, e.clientY);
	t && (t.tagName != "INPUT" || e.ctrlKey) && co(t);
}
//#endregion
//#region src/textInput.ts
var uo = /* @__PURE__ */ "ShiftLeft.ShiftRight.ControlLeft.ControlRight.AltLeft.AltRight.OptionLeft.OptionRight.CapsLock.Backspace.Escape.Delete.Insert.NumLock.ScrollLock.Pause.PrintScreen.F1.F2.F3.F4.F5.F6.F7.F8.F9.F10.F11.F12.F13.F14.F15.F16".split("."), fo = "ArrowLeft", po = "ArrowRight", R = 1, mo = "", ho = null, go = null, z = null, _o = !0;
function vo(e) {
	console.log(e);
}
function yo(e) {
	_o = e.which == 229;
	var t = e.currentTarget;
	ho = t, mo = t.value;
	var n = e.code;
	(n == null || n == "") && (n = e.key);
	var r = q(t, "word-input") ? "word-input" : "letter-input";
	let i;
	if (Z(t, "navigate-literals") || (i = q(t, "word-input") ? "word-non-input" : "letter-non-input"), q(t.parentNode, "multiple-letter") || q(t, "word-input")) {
		if (!((n == "Enter" || n == "NumpadEnter") && Q(t, "data-show-ready"))) {
			if (n == po || n == "Enter") {
				var a = t.selectionStart, o = t.selectionEnd;
				if (a == o && o == t.value.length) {
					let n = Ts(t, !0, !0, r) || Zo(t, R, 0, r, i);
					n != null && $(n, 0), e.preventDefault();
				}
			} else if (n == fo) {
				var a = t.selectionStart, o = t.selectionEnd;
				if (a == o && o == 0) {
					let n = Ts(t, !1, !0, r) || Zo(t, -R, 0, r, i);
					n != null && $(n, n.value.length), e.preventDefault();
				}
			}
		}
	} else {
		if (n == "Backspace" || n == "Space") {
			$o(t, n), e.preventDefault();
			return;
		}
		if (e.key.length == 1) {
			if (e.key == "`") co(t);
			else if (wo(t, e)) {
				t.value = e.key, Ao(t, e.key), e.preventDefault();
				return;
			}
		}
		if (Co(t, e)) return;
	}
	Co(t, e, !0) || Z(t, "digit-only") && e.key.length == 1 && !e.ctrlKey && !e.altKey && (e.key >= "A" && e.key < "Z" || e.key > "a" && e.key < "z") && e.preventDefault();
}
function bo(e) {
	var t = e.currentTarget;
	Co(t, e) && (ho = t);
}
var xo = [
	"ArrowLeft",
	"ArrowRight",
	"ArrowUp",
	"ArrowDown",
	"Home",
	"End",
	"PageUp",
	"PageDown"
];
function So(e) {
	return xo.indexOf(e) >= 0;
}
function Co(e, t, n = !1) {
	var r = t.code;
	if ((r == null || r == "") && (r = t.key), ys(e, r)) return t.preventDefault(), !0;
	var i = "word-input letter-input";
	let a;
	return Z(e, "navigate-literals") || (a = "word-non-input letter-non-input"), r == "ArrowUp" || r == "PageUp" ? ($(Zo(e, 0, -1, i, a)), t.preventDefault(), !0) : r == "ArrowDown" || r == "PageDown" ? ($(Zo(e, 0, 1, i, a)), t.preventDefault(), !0) : n ? !1 : r == po ? ($(t.ctrlKey ? es(e, R) : Zo(e, R, 0, i, a)), t.preventDefault(), !0) : r == fo ? ($(t.ctrlKey ? es(e, -R) : Zo(e, -R, 0, i, a)), t.preventDefault(), !0) : r == "Home" ? ($(Qo(e, -R, t.ctrlKey)), !0) : r == "End" ? ($(Qo(e, R, t.ctrlKey)), !0) : !1;
}
function wo(e, t) {
	return e.readOnly || t.key.length != 1 || t.ctrlKey || t.altKey ? !1 : e.inputMode === "numeric" ? t.key.match(/[0-9]/) : t.key.match(/[a-z0-9]/i);
}
function To(e) {
	if (!e.isComposing && ko(e)) {
		var t = e.currentTarget;
		Yo(t, e.key);
	}
}
var Eo = {
	deleteContentBackward: "Backspace",
	deleteContentForward: "Delete",
	insertParagraph: "Enter"
};
function Do(e) {
	let t = {
		code: "",
		shiftKey: !1,
		ctrlKey: !1,
		altKey: !1,
		key: e.data,
		target: e.target,
		currentTarget: e.currentTarget
	};
	return e.inputType in Eo && (t.code = Eo[e.inputType]), t;
}
function Oo(e) {
	if (_o) {
		let n = Do(e);
		if (yo(n), ko(n)) {
			var t = e.currentTarget;
			Yo(t, e.data || "");
		}
	}
}
function ko(e) {
	if (!e) return !1;
	el() && alert("code:" + e.code + ", key:" + e.key);
	var t = e.currentTarget;
	if (t != ho) return ho = null, e.code == "Tab" && document.activeElement == t && Ru(document.activeElement) && _s(document.activeElement), !0;
	ho = null;
	var n = e.code;
	if ((n == null || n == "") && (n = e.key), n == "Enter" && (n = e.shiftKey ? "ArrowUp" : "ArrowDown"), n == "Tab" || So(n) || n == "Backquote") return !0;
	if (t.value.length == 0 || uo.indexOf(n) >= 0) {
		if (!q(t.parentNode, "multiple-letter")) return Ao(t, e.key), !1;
	} else if (t.value.length === 1 && !t.value.match(/[a-z0-9]/i)) {
		var r = Y(t, "letter-input", void 0, -1);
		if (r != null && q(r, "letter-non-input") && Y(r, "letter-input") == t && r.getAttribute("data-literal") == t.value) return t.value = "", !0;
	}
	return Ao(t, e.key), !1;
}
function Ao(e, t) {
	var n = e.value;
	q(e.parentNode, "lower-case") ? n = n.toLocaleLowerCase() : q(e.parentNode, "any-case") || (n = n.toUpperCase());
	var r = "", i = Z(e, "vertical") ? Zo(e, 0, 1, "letter-input", "letter-non-input") : Ts(e, !0, !0, "letter-input", "letter-non-input") || Zo(e, R, 0, "letter-input", "letter-non-input"), a = q(e.parentNode, "multiple-letter"), o = a || q(e.parentNode, "word-cell") || q(e, "word-input");
	if (!o && n.length > 1) {
		let e = pu(n);
		n = e.splice(0, 1)[0], r = e.join("");
	}
	if (e.value = n, Mo(e), jo(e, t), !a) Lu(i) && r.length > 0 && i.value.length == 0 ? (i.value = r, $(i), Ao(i, t)) : Ru(i) && n.length > 0 && $(i);
	else if (!q(e.parentNode, "getElementsByClassName")) {
		var s = e.getBoundingClientRect(), c = e.inputMode == "numeric" ? 2 : 1.8, l = Math.floor(s.width * c / s.height), u = n.length <= l ? 0 : (n.length - l) * .05;
		e.style.letterSpacing = -u + "em";
	}
	o ? ta(e) : ea(e), X(e, "input") && Yo(e, t);
}
function jo(e, t) {
	let n = Q(e.parentElement, "data-show-ready");
	if (n) {
		let e = document.getElementById(n);
		e && An(e, t);
	}
}
function Mo(e) {
	var t = Q(e, "data-extracted-id", void 0, "extracted-");
	if (Z(e, "extract")) Po(t);
	else if (Z(e, "extractor")) Bo(e);
	else if (Z(e, "numbered")) zo(t);
	else {
		let t = Q(e, "data-show-ready");
		if (t) {
			let n = document.getElementById(t);
			n && An(n, e.value);
		}
	}
	Z(e, "copy-extractee") && Ko();
}
function No(e, t) {
	let n = Q(t, "data-extracted-id", void 0, "extracted-");
	return (e || "extracted") === (n || "extracted");
}
function Po(e) {
	let t = document.getElementById(e || "extracted");
	if (t == null) return;
	let n = Q(t, "data-extract-join") || "";
	if (t.getAttribute("data-extraction-source") != "data" && (t.getAttribute("data-number-pattern") != null || t.getAttribute("data-letter-pattern") != null)) {
		zo(e);
		return;
	}
	let r = Pu(document.getElementsByClassName("extract-input")), i = [], a = !1, o = !0;
	for (let t = 0; t < r.length; t++) {
		let n = r[t];
		if (No(e, n)) if (q(n, "extract-literal") || q(n, "letter-non-input")) i.push(Fo(n, !1)), a = !0;
		else {
			let e = n.value || "";
			e = e.trim(), o &&= e.length > 0, i.push(e || "_");
		}
	}
	if (a) {
		let t = 0;
		for (let n = 0; n < r.length; n++) {
			let a = r[n];
			No(e, a) && (q(a, "extract-literal") && (i[t] = Fo(a, o, i)), t++);
		}
	}
	Lo(i.join(n), t, o);
}
function Fo(e, t, n) {
	let r = e.hasAttributeNS("", "delay") === null ? Q(e, "data-extract-delay") : e.getAttributeNS("", "delay"), i = e.getAttributeNS("", "value") || Q(e, "data-extract-value"), a = Q(e, "data-extract-copy"), o = Q(e, "data-literal");
	return !t && r != null ? r : a ? n ? n[parseInt(a) - 1] : "" : i || o || "";
}
function Io(e) {
	return e == null ? !1 : e.length > 0 && e.match(/[^_\u00A0\u0020]/) != null;
}
function Lo(e, t, n) {
	if (q(t, "create-from-pattern")) {
		Ro(e, t, n);
		return;
	}
	q(t, "lower-case") ? e = e.toLocaleLowerCase() : q(t, "all-caps") && (e = e.toLocaleUpperCase());
	let r = X(t, "INPUT") ? t : null, i = X(t, "TEXT") ? t : null, a = q(t, "extract-literal") ? t : null;
	var o = r === null ? i === null ? t.innerText : i.innerHTML : r.value;
	!Io(e) && !Io(o) || (!Io(e) && Io(o) && (e = ""), a ? a.setAttributeNS("", "value", e) : r ? r.value = e : i ? (i.innerHTML = "", i.appendChild(document.createTextNode(e))) : q(t, "create-from-pattern") || (t.innerText = e), Vo(t, e, n), X(t, "input") ? Mo(t) : a && Po(Q(a, "data-extracted-id", void 0, "extracted-")));
}
function Ro(e, t, n) {
	let r = t.getElementsByClassName("extractor-input");
	r.length > e.length && (e += Array(1 + r.length - e.length).join("_"));
	for (let t = 0; t < r.length; t++) {
		let i = r[t];
		e[t] == "_" ? (i.value = "", n = !1) : i.value = e.substring(t, t + 1), ea(i);
	}
	Vo(t, e, n);
}
function zo(e) {
	let t = document.getElementById(e || "extracted");
	var n = t?.getElementsByTagName("input"), r = document.getElementsByClassName("extract-input");
	let i = Pu(r), a = "";
	for (let e = 0; e < i.length; e++) {
		let t = i[e], r = t, o = t.getAttribute("data-number"), s = document.getElementById("extractor-" + o);
		!s && n && (s = n[e]);
		let c = r.value || "";
		c = c.trim(), (c.length > 0 || s.value.length > 0) && (s.value = c), a += c;
	}
	t && Vo(t, a, a.length == r.length);
}
function Bo(e) {
	var t = Q(e, "data-extracted-id", void 0, "extracted-"), n = document.getElementsByClassName("extractor-input"), r = Q(e.parentNode, "data-number");
	if (r === null) {
		for (let t = 0; t < n.length; t++) if (n[t] == e) {
			r = "" + (t + 1);
			break;
		}
	}
	if (r === null) return;
	var i = document.getElementsByClassName("extract-input");
	let a, o = [];
	for (let n = 0; n < i.length; n++) {
		var s = i[n];
		if (No(t, s)) {
			var c = Q(s, "data-number");
			c != null && (c == r && (s.value = e.value, ea(s), a = Q(s, "data-extracted-id", void 0, "extracted-")), o[parseInt(c)] = s.value);
		}
	}
	let l = o.join("");
	Vo(a, l, l.length == i.length);
}
function Vo(e, t, n) {
	let r = e ? typeof e == "string" ? document.getElementById(e) : e : document.getElementById("extracted");
	if (r) {
		r.setAttribute("data-extraction", t);
		let e = Q(r, "data-show-ready");
		e && An(document.getElementById(e), t), e && tl() && console.log("Extraction is " + (n ? "ready:" : "NOT ready:") + t);
	}
}
function Ho(e) {
	_o && Uo(Do(e));
}
function Uo(e) {
	if (e.isComposing) return;
	let t = e.currentTarget;
	Yo(t, e.key), Q(t, "data-extract-index") != null && Wo(Q(t, "data-extracted-id", void 0, "extracted-")), Z(t, "copy-extractee") && Ko(), jo(t, e.key);
	var n = e.code;
	if (!((n == "Enter" || n == "NumpadEnter") && Q(t, "data-show-ready"))) {
		if (n == "PageUp") {
			$(Y(t, "word-input", void 0, -1));
			return;
		} else if (n == "Enter" || n == "NumpadEnter" || n == "PageDown") {
			$(Y(t, "word-input"));
			return;
		}
	}
	ta(t);
}
function Wo(e) {
	var t = document.getElementById(e || "extracted");
	if (t == null) return;
	let n = Pu(document.getElementsByClassName("word-input")), r = [], i = !1, a = !1, o = !0, s = !1;
	for (let t = 0; t < n.length; t++) {
		let l = n[t];
		if (!No(e, l)) continue;
		if (q(l, "extract-literal") || q(l, "word-literal")) {
			r.push(Fo(l, !1)), s = !0;
			continue;
		}
		var c = Q(l, "data-extract-index", "");
		if (c === null) continue;
		i = !0;
		let u = c.split(" "), d = "";
		for (let e = 0; e < u.length; e++) {
			let t = l, n = t.value;
			if (u[e] !== "*") {
				let r = u[e].split(".").map((e) => parseInt(e, 10));
				n = Go(t.value, r[0], r.length > 1 ? r[1] : 0, "_", "");
			}
			n && (d += n.toUpperCase(), a ||= n != "_", o &&= n != "_");
		}
		r.push(d);
	}
	if (s) {
		let t = 0;
		for (let i = 0; i < n.length; i++) {
			let a = n[i];
			No(e, a) && (q(a, "extract-literal") && (r[t] = Fo(a, o, r)), t++);
		}
	}
	let l = r.join("");
	i && Lo(l, t, o);
}
function Go(e, t, n, r, i) {
	if (e.trim()) e = e.toUpperCase();
	else return r;
	let a = t;
	if (n > 0) {
		a = n;
		let r = e.split(" ");
		e = "";
		for (let n = 0; n < r.length; n++) {
			let i = r[n];
			if (r[n].length > 0 && --t == 0) {
				e = i;
				break;
			}
		}
	}
	for (let t = 0; t < e.length; t++) {
		let n = e[t];
		if (n.trim() && --a == 0) return n;
	}
	return i;
}
function Ko() {
	let e = document.getElementsByClassName("copy-extracter");
	for (let t = 0; t < e.length; t++) {
		let n = e[t], r = Q(n, "data-copy-blank", "") || "", i = "", a = "", o = (Q(n, "data-copy-id", "") || "").split(" ");
		for (let e = 0; e < o.length; e++) {
			let t = o[e].split(".");
			if (t[0]) {
				let e = Es(document.getElementById(t[0]), "");
				t.length == 2 ? e = Go(e, parseInt(t[1]), 0, "", "") : t.length > 2 && (e = Go(e, parseInt(t[1]), parseInt(t[2]), r, r)), e ? (i += a + e, a = "") : a += " ";
			}
		}
		if (!Lu(n)) {
			let e = n?.getElementsByTagName("input");
			if (!e || e.length == 0) throw Error(`Element with copy-id=${o} must be an input element, or a letter-/word-cell parent of one`);
			if (e.length > 1) throw Error(`Element with copy-id=${o} appears to be a container of multiple input elements`);
			if (n = e[0], !Lu(n)) throw Error(`Element with copy-id=${o} must be an input element, or a letter-/word-cell parent of one`);
		}
		n.value = i.trim();
	}
}
function qo(e) {
	if (e.isComposing) return;
	let t = Z(e.currentTarget, "letter-input");
	ea(t), Yo(t, e.key);
}
function Jo(e) {
	if (e.isComposing) return;
	let t = Z(e.currentTarget, "word-input");
	Yo(t, e.key), ta(t);
}
function Yo(e, t) {
	let n = W().onInputChange;
	n && n(e);
	let r = Q(e, "data-onchange");
	if (r) {
		let n = window[r];
		n && n(e, t);
	}
}
function Xo(e) {
	return Z(e, "letter-grid-2d") ?? document.getElementById("pageBody");
}
function Zo(e, t, n, r, i) {
	let a = Xo(e), o = Z(e, "loop-navigation"), s = null;
	if (a != null && (s = ss(a, e, t, n, void 0, i), s != null)) return s;
	let c = Z(e, "letter-grid-discover");
	if (c != null && (s = ms(c, e, t, n, void 0, i), s != null || (s = ls(c, e, t, n, void 0, i), s != null)) || n < 0 && (s = Cu(e, r, i, "letter-cell-block", -1), s != null) || n > 0 && (s = Cu(e, r, i, "letter-cell-block"), s != null)) return s;
	let l = t == -R || n < 0, u = ts(e, r, i, "text-input-group", l ? -1 : 1);
	for (; u != null && u.disabled;) u = ts(u, r, i, "text-input-group", l ? -1 : 1);
	return o != null && Z(u, "loop-navigation") != o && (s = ku(o, r, i, l ? -1 : 1), s) ? s : u;
}
function Qo(e, t, n) {
	if (!n && z) {
		let e = Ss(z);
		return (R * Cs(z) < 0 || ws(z) < 0) && (t = -t), t > 0 ? e[e.length - 1] : e[0];
	}
	let r = Xo(e);
	if (r) {
		let i;
		return i = n ? os(r, void 0, -t, void 0, "letter-non-input") : os(r, e, 0, void 0, "letter-non-input"), t > 0 ? i[i.length - 1] : i[0];
	}
	return wu(e, "letter-input", "letter-non-input", "letter-cell-block", -t);
}
function $o(e, t) {
	let n = null;
	if (t == "Space" && (n = Y(e, "letter-input", void 0, -1), n != null && q(n, "letter-non-input") && Y(n, "letter-input") == e)) {
		var r = n.getAttribute("data-literal");
		if ((r == " " || r == "Â¶") && (n = Y(n, "letter-input", "literal", -1), n != null && n.value != "")) return !1;
	}
	if (e != null && z) {
		let n = Ss(z), r = n.indexOf(e);
		return r >= 0 ? (t == "Backspace" ? e.value.length == 0 && r > 0 && (e = n[r - 1], $(e)) : e.value.length == 0 && r < n.length - 1 && (e = n[r + 1], $(e)), e.value.length > 0 && (e.value = "", Ao(e, t)), !0) : !1;
	}
	n = null;
	var i = t == "Backspace" ? -R : R, a = t == "Backspace" ? -1 : 1;
	if (mo.length == 0) {
		var o = Z(e, "letter-grid-discover");
		if (o != null) n = Z(e, "vertical") ? ls(o, e, 0, a, "letter-input", "letter-non-input") : ls(o, e, i, 0, "letter-input", "letter-non-input");
		else if (n = ts(e, "letter-input", "letter-non-input", "text-input-group", i), !n) {
			let t = Z(e, "loop-navigation");
			t && (n = ku(t, "letter-input", "letter-non-input", i));
		}
		Mo(e), n !== null && ($(n), e = n);
	}
	return e != null && e.value.length > 0 && (q(e.parentNode, "multiple-letter") ? n != null && (a < 0 ? e.value = e.value.substring(0, e.value.length - 1) : e.value = e.value.substring(1)) : e.value = ""), Ao(e, t), !0;
}
function es(e, t) {
	let n = os(Xo(e) || void 0, e, 0, void 0, "letter-non-input");
	if (n.length == 1) return Zo(e, t, 0, "letter-input", "letter-non-input");
	let r = 0, i = [n[0].getBoundingClientRect()], a = 0;
	for (let t = 1; t < n.length; t++) {
		n[t] === e && (a = t);
		let o = n[t].getBoundingClientRect();
		r += o.left - i[t - 1].right, i.push(o);
	}
	if (r /= n.length - 1, r *= 1.01, t > 0) {
		for (let e = a + 1; e < n.length; e++) if (i[e].left - i[e - 1].right > r) return n[e];
		return Zo(n[n.length - 1], 1, 0, "letter-input", "letter-non-input");
	} else {
		for (let e = a - 1; e >= 0; e--) if (i[e + 1].left - i[e].right > r) return n[e];
		return Zo(n[0], -1, 0, "letter-input", "letter-non-input");
	}
}
function ts(e, t, n, r, i = 1) {
	var a = Z(e, r), o = Y(e, t, n, i);
	return a != null && (o == null || Z(o, r) != a) && (o = ku(a, t, n, i)), o;
}
function ns(e, t) {
	let n = e.getBoundingClientRect(), r = t.getBoundingClientRect();
	return n.top >= r.bottom ? 1 : n.bottom <= r.top ? -1 : 0;
}
function rs(e, t) {
	let n = is(e.getBoundingClientRect(), .9), r = is(t.getBoundingClientRect(), .9);
	return n.left >= r.right ? 1 : n.right <= r.left ? -1 : 0;
}
function is(e, t) {
	return new DOMRect(e.x + e.width / 2 - e.width * t / 2, e.y + e.height / 2 - e.height * t / 2, e.width * t, e.height * t);
}
function as(e, t, n) {
	let r = [], i = [
		"input",
		"textarea",
		"select",
		"button"
	], a = t ? t.split(" ") : void 0, o = n ? n.split(" ") : void 0;
	e ||= document;
	for (let t = 0; t < i.length; t++) {
		let n = e.getElementsByTagName(i[t]);
		for (let e = 0; e < n.length; e++) {
			let t = n[e], i = !a;
			if (a) {
				for (let e = 0; e < a.length; e++) if (q(t, a[e])) {
					i = !0;
					break;
				}
			}
			if (i && o) {
				for (let e = 0; e < o.length; e++) if (q(t, o[e])) {
					i = !1;
					break;
				}
			}
			i && r.push(t);
		}
	}
	return r;
}
function os(e, t, n, r, i) {
	let a = as(e, r, i), o = n == 0 ? t : void 0;
	if (!t && n == 0) throw Error("Can't search for the current row, without a current reference");
	let s = [];
	for (let e = 0; e < a.length; e++) {
		let r = a[e], i = n;
		if (t && (i = ns(r, t), i == 0 && n == 0 && s.push(r)), i * n > 0) if (!o) o = r, s = [r];
		else {
			let e = ns(r, o);
			e == 0 ? s.push(r) : e * n < 0 && (o = r, s = [r]);
		}
	}
	return s.sort((e, t) => rs(e, t)), s;
}
function ss(e, t, n, r, i, a) {
	let o = os(e, t, r, i, a);
	if (o.length == 0) {
		if (r == 0) return t || null;
		o = os(cs(e, r), void 0, r, i, a);
	}
	if (!t || r != 0 && n != 0) return n >= 0 ? o[0] : o[o.length - 1];
	let s;
	for (let e = 0; e < o.length; e++) {
		let r = o[e], i = rs(r, t);
		if (n == 0 && i == 0 || n >= 0 && i > 0) return r;
		n <= 0 && i < 0 && (s = r);
	}
	return !s && r == 0 ? ss(e, t, n, n * R, i, a) : s || null;
}
function cs(e, t) {
	if (!q(e, "letter-grid-2d")) return e;
	let n = document.getElementsByClassName("letter-grid-2d");
	if (n) {
		for (let r = 0; r < n.length; r++) if (n[r] == e) return n[(r + n.length + t) % n.length];
	}
	return document.getElementById("pageBody");
}
function ls(e, t, n, r, i, a) {
	let o = t.getBoundingClientRect(), s = {
		x: o.x + o.width / 2,
		y: o.y + o.height / 2
	}, c = as(document, i), l = 0, u = null;
	for (let t = 0; t < c.length; t++) {
		let i = c[t];
		if (!(a != null && q(i, a)) && !(e != null && e != Z(i, "letter-grid-discover"))) {
			if (o = i.getBoundingClientRect(), n != 0) {
				if (s.y >= o.y && s.y < o.y + o.height) {
					let e = (o.x + o.width / 2 - s.x) / n;
					e > 0 && (u == null || e < l) && (l = e, u = i);
				}
			} else if (r != 0 && s.x >= o.x && s.x < o.x + o.width) {
				let e = (o.y + o.height / 2 - s.y) / r;
				e > 0 && (u == null || e < l) && (l = e, u = i);
			}
		}
	}
	if (u != null) return u;
	o = t.getBoundingClientRect(), s = R > 0 ? {
		x: o.x + (r > 0 ? o.width - 1 : 1),
		y: o.y + (n > 0 ? o.height - 1 : 1)
	} : {
		x: o.x + (r < 0 ? o.width - 1 : 1),
		y: o.y + (n < 0 ? o.height - 1 : 1)
	};
	let d = 0, f = null;
	for (let t = 0; t < c.length; t++) {
		let i = c[t];
		if (a != null && q(i, a) || e != null && e != Z(i, "letter-grid-discover")) continue;
		(f == null || n < 0 || r < 0) && (f = i), o = i.getBoundingClientRect();
		let p = 0, m = 0;
		n == 0 ? r != 0 && (p = (o.x + o.width / 2 - s.x) / (r * R), m = o.y / r) : (p = (o.y + o.height / 2 - s.y) / (n * R), m = o.x / n), p > 0 && (u == null || p < l || p == l && m < d) && (l = p, d = m, u = i);
	}
	return u ?? f;
}
function us(e, t) {
	let n = Math.min(e.left, t.left), r = Math.max(e.right, t.right), i = Math.min(e.top, t.top), a = Math.max(e.bottom, t.bottom);
	return new DOMRect(n, i, r - n, a - i);
}
function ds(e, t) {
	return t == 0 ? Math.abs(e) * 1.2 : e * t > 0 ? Math.abs(e * .8) : -1;
}
function fs(e, t, n, r) {
	let i = ds(t.x - e.x, n), a = ds(t.y - e.y, r);
	return i < 0 || a < 0 ? -1 : Math.sqrt(i * i + a * a);
}
function ps(e, t, n, r) {
	return n > 0 ? new DOMPoint(e.left - n, t.y) : n < 0 ? new DOMPoint(e.right - n, t.y) : r > 0 ? new DOMPoint(t.x, e.top - r) : r < 0 ? new DOMPoint(t.x, e.bottom - r) : t;
}
function ms(e, t, n, r, i, a) {
	let o = t.getBoundingClientRect(), s = o, c = new DOMPoint(o.x + o.width / 2, o.y + o.height / 2), l = as(document, i), u = -1, d = null;
	for (let t = 0; t < l.length; t++) {
		let i = l[t];
		if (a != null && q(i, a) || e != null && e != Z(i, "letter-grid-discover")) continue;
		o = i.getBoundingClientRect(), s = us(s, o);
		let f = new DOMPoint(o.x + o.width / 2, o.y + o.height / 2), p = fs(c, f, n, r);
		p > 0 && (d == null || p < u) && (d = i, u = p);
	}
	if (d == null) {
		c = ps(s, c, n, r);
		for (let t = 0; t < l.length; t++) {
			let i = l[t];
			if (a != null && q(i, a) || e != null && e != Z(i, "letter-grid-discover")) continue;
			o = i.getBoundingClientRect();
			let s = new DOMPoint(o.x + o.width / 2, o.y + o.height / 2), f = fs(c, s, n, r);
			f > 0 && (d == null || f < u) && (d = i, u = f);
		}
	}
	return d;
}
function hs(e, t) {
	var n = e.value.toLowerCase(), r = null;
	for (let e of t) if (e.toLowerCase().indexOf(n) == 0) {
		if (r) return !1;
		r = e;
	}
	if (r) {
		var i = e.value.length;
		return e.value = r, e.setSelectionRange(i, r.length), !0;
	}
	return !1;
}
function gs(e) {
	let t = Q(e, "data-input-groups");
	if (!t) return null;
	let n = t.split(" ");
	if (z) {
		if (n.indexOf(z) >= 0) return z;
		let e = z.split(":")[0];
		for (let t = 0; t < n.length; t++) if (n[t].split(":")[0] == e) return n[t];
	}
	return n[0];
}
function _s(e) {
	let t = null;
	if (go != e) t = gs(e);
	else {
		let n = Q(e, "data-input-groups");
		if (n) {
			let e = n.split(" "), r = e.indexOf(z || "");
			r = (r + 1) % e.length, t = e[r];
		}
	}
	if (t != z) {
		if (_u("input-group"), t) {
			let e = Ss(t);
			for (let t = 0; t < e.length; t++) K(e[t], "input-group", !0);
		}
		z = t;
	}
	go = t ? e : null;
}
var vs = {
	u: "d",
	d: "u",
	l: "r",
	r: "l"
};
function ys(e, t) {
	if (!z) return !1;
	let n = z.split(":")[0];
	if (!n || !t.startsWith("Arrow")) return !1;
	let r = t.substring(5, 6).toLowerCase();
	if (!(r in vs) || n[0] == r || n[0] == vs[r]) return !1;
	let i = (Q(e, "data-input-groups") || "").split(" ");
	for (let e = 0; e < i.length; e++) {
		let t = i[e], n = t.split(":");
		if (n.length > 1 && n[0][0] == r) {
			_u("input-group");
			let e = Ss(t);
			for (let t = 0; t < e.length; t++) K(e[t], "input-group", !0);
			return z = t, !0;
		}
	}
	return !1;
}
function bs(e) {
	let t = e.split(":");
	return t.length > 2 && (e = `${t[0]}:${t[1]}`), e;
}
function xs(e, t = void 0) {
	let n = Q(e, "data-input-groups");
	if (n) {
		if (!t) return !0;
		t = bs(t);
		let e = n.split(" ");
		for (let n = 0; n < e.length; n++) if (bs(e[n]) == t) return !0;
	}
	return !1;
}
function Ss(e, t = void 0, n = void 0) {
	let r = [];
	if (t) {
		let i = document.getElementsByClassName(t);
		for (let t = 0; t < i.length; t++) !q(i[t], n) && xs(i[t], e) && r.push(i[t]);
		return r;
	}
	let i = [
		"input",
		"textarea",
		"select",
		"button"
	];
	for (let t = 0; t < i.length; t++) {
		let n = document.getElementsByTagName(i[t]);
		for (let t = 0; t < n.length; t++) xs(n[t], e) && r.push(n[t]);
	}
	return r;
}
function Cs(e) {
	let t = e.split(":");
	if (t.length <= 1) return R;
	let n = t[0].toLowerCase();
	return n.indexOf("r") >= 0 ? 1 : n.indexOf("l") >= 0 ? -1 : n.indexOf("h") >= 0 ? R : 0;
}
function ws(e) {
	let t = e.split(":");
	if (t.length <= 1) return 0;
	let n = t[0].toLowerCase();
	return n.indexOf("d") >= 0 ? 1 : n.indexOf("u") >= 0 ? -1 : n.indexOf("v") >= 0 ? R : 0;
}
function Ts(e, t, n, r = void 0, i = void 0) {
	let a = gs(e);
	if (!a) return null;
	let o = Cs(a), s = ws(a);
	if (o == 0 && s == 0) return console.error(`Input group "${a}" has unrecognized direction prefix.`), null;
	t || (o = -o, s = -s);
	let c = Ss(a, r, i), l = null;
	for (let t = 0; t < c.length; t++) {
		let n = c[t];
		rs(n, e) == o && ns(n, e) == s && (!l || rs(n, l) == -o && ns(n, l) == -s) && (l = n);
	}
	if (!l && n) for (let e = 0; e < c.length; e++) {
		let t = c[e];
		(!l || rs(t, l) == -o && ns(t, l) == -s) && (l = t);
	}
	return l;
}
function Es(e, t) {
	if (X(e, "input") || X(e, "textarea")) return e.value;
	let n = e.getElementsByClassName("letter-input");
	if (n.length == 0 && (n = e.getElementsByClassName("word-input")), n.length > 0) {
		let e = "";
		for (let r = 0; r < n.length; r++) if (!q(n[r], "letter-non-input")) {
			let i = n[r].value;
			e += i || t;
		}
		return e;
	}
	let r = Nu(e, "data-extraction");
	if (r.length > 0) {
		let e = "";
		for (let t = 0; t < r.length; t++) e += r[t].getAttribute("data-extraction");
		return e;
	}
	return e.getAttribute("data-extraction") ?? (console.error("Unrecognized value container: " + e), "");
}
//#endregion
//#region src/textSetup.ts
function Ds() {
	Os(), zs(), Is(), Ls(), Rs(), Vs(), ha();
}
function Os() {
	let e = document.getElementsByClassName("letter-cell-table");
	for (let n = 0; n < e.length; n++) {
		let r = e[n], i = Z(r, "navigate-literals") != null, a = r.getElementsByTagName("td");
		for (let e = 0; e < a.length; e++) {
			let n = a[e];
			if (!q(n, "no-cell")) {
				if (n.innerHTML == "") {
					K(n, "create-from-pattern", !0), Q(n, "data-letter-pattern") || n.setAttributeNS(null, "data-letter-pattern", "1");
					let e = n.parentNode;
					K(e, "letter-cell-block", !0), q(n, "extract") && n.setAttributeNS(null, "data-extract-indeces", "1");
				} else if (K(n, "literal", !0), q(n, "extract") && (K(n, "extract-input", !0), K(n, "extract-literal", !0), n.setAttributeNS(null, "data-extract-value", n.innerText)), i) {
					var t = document.createElement("span");
					K(t, "letter-cell", !0), K(t, "literal", !0), K(t, "read-only-overlay", !0), n.appendChild(t);
				}
			}
		}
	}
	let n = document.getElementsByClassName("create-from-pattern");
	for (let e = 0; e < n.length; e++) {
		var r = n[e];
		if (!(r.id === "extracted" || q(r, "extracted"))) {
			var i = Ms(r, "data-letter-pattern"), a = Ns(r, "data-extract-indeces"), o = Ps(r, "data-number-assignments"), s = q(r, "vertical"), c = q(r, "numeric"), l = ks(r, "underline", "none", Object.keys(o).length == 0 ? "box" : "numbered");
			if (i != null && i.length > 0) {
				var u = 0;
				for (let e = 0; e < i.length; e++) if (i[e].count) {
					var d = i[e].count, f = document.createElement("span");
					s || K(f, "letter-cell-set", !0);
					for (let n = 1; n <= d; n++) {
						var t = document.createElement("span");
						K(t, "letter-cell", !0), J(t, l.letter), K(t, "numeric", c);
						var p = u + n;
						if (a.indexOf(p) >= 0 && (K(t, "extract", !0), J(t, l.extract)), o[p] !== void 0) {
							t.setAttributeNS("", "data-extract-order", "" + o[p]), K(t, "extract", !0), K(t, "numbered", !0), J(t, l.extract);
							var m = document.createElement("span");
							K(m, "under-number"), m.innerText = o[p], t.setAttribute("data-number", o[p]), t.appendChild(m);
						}
						f.appendChild(t), s && (n < d || e < i.length - 1) && f.appendChild(document.createElement("br"));
					}
					r.appendChild(f), u += d;
				} else if (i[e].char !== null) {
					let n = i[e].char;
					var t = As(n);
					K(t, l.literal, !0), r.appendChild(t), s && e < i.length - 1 && r.appendChild(document.createElement("br"));
				}
			}
		}
	}
}
function ks(e, t, n, r) {
	let i = Q(e, "data-letter-style", void 0, "letter-") || Q(e, "data-input-style", t, "letter-");
	i === "letter-grid" && (n = "grid", r = "grid-highlight");
	let a = Q(e, "data-literal-style", n);
	a = a == null ? i : "literal-" + a;
	let o = Q(e, "data-extract-style", r, "extract-"), s = Q(e, "data-word-style", "underline", "word-");
	return {
		letter: i,
		extract: o,
		literal: a,
		word: s,
		hidden: "hide-element"
	};
}
function As(e) {
	if (e == "Â¶") {
		var t = document.createElement("br");
		return t.classList.add("letter-input"), t.classList.add("letter-non-input"), t.setAttributeNS(null, "data-literal", "Â¶"), t;
	}
	var n = document.createElement("span");
	return n.classList.add("letter-cell"), n.classList.add("literal"), js(n, e), n;
}
function js(e, t) {
	t == " " ? e.innerText = "\xA0" : t == "Â¤" ? (e.innerText = "\xA0", e.classList.add("block")) : e.innerText = t;
}
function Ms(e, t) {
	let n = [], r = e.getAttributeNS("", t);
	if (r == null) return n;
	for (let e = 0; e < r.length; e++) {
		let t = 0;
		for (; e < r.length && r[e] >= "0" && r[e] <= "9";) t = t * 10 + (r.charCodeAt(e) - 48), e++;
		t > 0 && n.push({ count: t }), e < r.length && (r[e] == "`" && e + 1 < r.length && e++, n.push({ char: r[e] }));
	}
	return n;
}
function Ns(e, t, n = 0) {
	var r = e.getAttributeNS("", t);
	n ||= 0;
	let i = [];
	if (r != null) {
		var a = r.split(" ");
		for (let e = 0; e < a.length; e++) i.push(parseInt(a[e]) + n);
	}
	return i;
}
function Ps(e, t, n = 0) {
	var r = e.getAttributeNS("", t);
	n ||= 0;
	var i = {};
	if (r != null) {
		var a = r.split(" ");
		for (let e = 0; e < a.length; e++) {
			var o = a[e].split("=");
			i[parseInt(o[0]) + n] = o[1];
		}
	}
	return i;
}
var Fs = [
	"size",
	"maxlength",
	"inputmode"
];
function Is() {
	let e = Pu(document.getElementsByClassName("letter-cell")), t = 1, n = 1;
	for (let o = 0; o < e.length; o++) {
		let s = e[o], c = Z(s, "navigate-literals") != null, l = s.getAttributeNS("", "under-text");
		if (l) {
			let e = document.createElement("span");
			K(e, "under-number"), e.innerText = l, s.appendChild(e);
		}
		let u = document.createElement("input");
		u.type = "text", we(s, u, Fs);
		let d;
		if ((d = s.getAttributeNS("", "input-id")) && (u.id = d), q(s, "numeric") && (u.pattern = "[0-9]*", u.inputMode = "numeric"), K(u, "letter-input"), q(s, "extract")) {
			K(u, "extract-input");
			var r = Q(s, "data-extract-image");
			if (r != null) {
				var i = document.createElement("img");
				i.src = r, i.classList.add("extract-image"), s.appendChild(i);
			}
			if (q(s, "numbered")) {
				K(u, "numbered-input");
				let e = s.getAttribute("data-number");
				e != null && u.setAttribute("data-number", e);
			} else u.setAttribute("data-number", "" + t++);
		}
		if (q(s, "extractor") && (K(u, "extractor-input"), u.id = "extractor-" + n++), q(s, "literal")) {
			K(u, "letter-non-input");
			let e = s.innerText;
			if (s.innerHTML = "", u.setAttribute("data-literal", e == "\xA0" ? " " : e), c) u.setAttribute("readonly", ""), u.value = e;
			else {
				u.setAttribute("disabled", "");
				var a = document.createElement("span");
				K(a, "letter-literal"), a.innerText = e, s.appendChild(a);
			}
		}
		s.appendChild(u);
	}
}
function Ls() {
	var e = document.getElementsByClassName("letter-input");
	for (let t = 0; t < e.length; t++) {
		let n = e[t];
		n.onkeydown = function(e) {
			yo(e);
		}, n.onkeyup = function(e) {
			To(e);
		}, n.onchange = function(e) {
			qo(e);
		}, n.oninput = function(e) {
			Oo(e);
		};
	}
	var t = document.getElementsByTagName("button");
	for (let e = 0; e < t.length; e++) {
		let n = t[e];
		n.onkeydown = function(e) {
			bo(e);
		};
	}
}
function Rs() {
	var e = document.getElementsByClassName("word-cell");
	for (let t = 0; t < e.length; t++) {
		let n = e[t], r = Q(n, "data-word-style", "underline", "word-"), i = document.createElement("input");
		i.type = "text", K(i, "word-input"), we(n, i, Fs);
		let a;
		(a = n.getAttributeNS("", "input-id")) && (i.id = a), q(n, "literal") ? (i.setAttribute("disabled", ""), K(i, "word-literal"), i.value = n.innerText, n.innerHTML = "", r = Q(n, "data-literal-style", void 0, "word-") || r) : (i.onkeydown = function(e) {
			yo(e);
		}, i.onkeyup = function(e) {
			Uo(e);
		}, i.onchange = function(e) {
			Jo(e);
		}, i.oninput = function(e) {
			Ho(e);
		}, q(n, "numeric") && (i.pattern = "[0-9]*", i.inputMode = "numeric")), n.appendChild(i);
		let o = n.getAttributeNS("", "data-extract-index");
		if (o !== null) {
			let e = document.createElement("span");
			K(e, "letter-index"), e.innerText = o;
			let t = Q(n, "data-index-style", "none", "index-");
			t && J(e, t), n.appendChild(e);
		}
	}
}
function zs() {
	var e = document.getElementsByClassName("create-from-pattern");
	for (let t of Array.from(e)) (t.id === "extracted" || q(t, "extracted")) && Bs(t);
}
function Bs(e) {
	if (e === null) return;
	let t = "data-letter-pattern", n = !1, r = !1;
	e.hasAttributeNS("", "data-extract-numbered") ? (n = !0, t = "data-extract-numbered") : e.hasAttributeNS("", "data-extract-lettered") ? (n = r = !0, t = "data-extract-lettered") : e.hasAttributeNS("", "data-extracted-pattern") && (t = "data-extracted-pattern");
	var i = ks(e, "underline", "none", "");
	let a = Ms(e, t);
	var o = 1;
	for (let t = 0; t < a.length; t++) if (a[t].count) {
		var s = a[t].count;
		for (let t = 1; t <= s; t++) {
			let t = document.createElement("span");
			if (K(t, "letter-cell", !0), K(t, "extractor", !0), J(t, i.letter), e.appendChild(t), n) {
				K(t, "numbered");
				let e = document.createElement("span");
				K(e, "under-number"), e.innerText = r ? String.fromCharCode(64 + o) : "" + o, t.setAttribute("data-number", "" + o), t.appendChild(e), o++;
			}
		}
	} else if (a[t].char !== null) {
		var c = As(a[t].char);
		J(c, i.literal), e.appendChild(c);
	}
}
function Vs() {
	let e = document.getElementsByClassName("copy-extracter");
	for (let t = 0; t < e.length; t++) {
		let n = e[t].getAttribute("data-copy-id");
		if (n) {
			let e = n.split(" ");
			for (let t = 0; t < e.length; t++) {
				let n = e[t].split(".")[0], r = document.getElementById(n);
				r && K(r, "copy-extractee", !0);
			}
		}
	}
}
function Hs(e) {
	e.addEventListener("pointerdown", function(e) {
		Ks(e);
	}), e.addEventListener("pointerup", function(e) {
		qs(e);
	}), e.addEventListener("pointerleave", function() {
		Js();
	});
}
var Us = null, Ws = null, Gs = 0;
function Ks(e) {
	Us = document.elementsFromPoint(e.clientX, e.clientY), document.caretRangeFromPoint && (Ws = document.caretRangeFromPoint(e.clientX, e.clientY));
	let t = Date.now();
	t - Gs < 300 && Js(), Gs = t;
}
function qs(e) {
	if (Us) {
		let t = document.elementsFromPoint(e.clientX, e.clientY), n = t.length == Us.length;
		if (n) {
			for (let e = 0; e < t.length; e++) if (t[e] != Us[e]) {
				n = !1;
				break;
			}
		}
		if (n) if (!document.caretRangeFromPoint) Xs(e);
		else {
			let t = document.caretRangeFromPoint(e.clientX, e.clientY);
			Ys(Ws, t) && Xs(e);
		}
	}
	Js();
}
function Js() {
	Us = null, Ws = null;
}
function Ys(e, t) {
	return !e && !t ? !0 : !e || !t || e.startContainer != e.endContainer || e.startContainer != t.startContainer || t.startContainer != t.endContainer ? !1 : e.startOffset == e.endOffset && t.startOffset == t.endOffset && e.startOffset == t.startOffset;
}
function Xs(e) {
	if (!e.ctrlKey && !e.shiftKey && !e.altKey && e.isTrusted) {
		let t = document.elementsFromPoint(e.clientX, e.clientY), n;
		for (let e = 0; e < t.length; e++) {
			let r = t[e];
			if (r.getAttribute("disabled") === null && (Ru(r) || X(r, "a"))) {
				n = r;
				break;
			}
			if (Z(r, "word-select-area") || Z(r, "straight-edge-area") || Z(r, "hashi-bridge-area") || Z(r, "moveable") || Z(r, "drop-target") || q(r, "stampTool") || q(r, "stampLock") || Z(r, "stampable") || Z(r, "cross-off")) return;
			if (r.id == "page" || r.id == "scratch-pad" || q(r, "scratch-div")) break;
			if (q(r, "clickable") || r.id.indexOf("-toggle") >= 0) return;
		}
		let r = NaN;
		if (n) r = 0;
		else {
			let t = [
				"input",
				"textarea",
				"select",
				"a",
				"clickable",
				"stampable"
			];
			for (let i = 0; i < t.length; i++) {
				let a = t[i] === "clickable" ? document.getElementsByClassName(t[i]) : document.getElementsByTagName(t[i]);
				for (let t = 0; t < a.length; t++) {
					let i = a[t];
					if (i.style.display !== "none" && i.getAttribute("disabled") === null) {
						let t = Zs(e, i);
						(Number.isNaN(r) || t < r) && (n = i, r = t);
					}
				}
			}
		}
		n && (X(n, "a") && r < 50 ? n.click() : q(n, "clickable") ? (xs(n) && _s(n), n.click()) : $(n));
	}
}
function Zs(e, t) {
	let n = t.getBoundingClientRect();
	return e.clientX < n.left ? e.clientY < n.top ? Qs(e.clientX, e.clientY, n.left, n.top) : e.clientY < n.bottom ? Qs(e.clientX, e.clientY, n.left, e.clientY) : Qs(e.clientX, e.clientY, n.left, n.bottom) : e.clientX > n.right ? e.clientY < n.top ? Qs(e.clientX, e.clientY, n.right, n.top) : e.clientY < n.bottom ? Qs(e.clientX, e.clientY, n.right, e.clientY) : Qs(e.clientX, e.clientY, n.right, n.bottom) : e.clientY < n.top ? Qs(e.clientX, e.clientY, e.clientX, n.top) : e.clientY < n.bottom ? 0 : Qs(e.clientX, e.clientY, e.clientX, n.bottom);
}
function Qs(e, t, n, r) {
	return Math.sqrt((e - n) * (e - n) + (t - r) * (t - r) * 3);
}
//#endregion
//#region src/decoders.ts
function $s() {
	let e = document.getElementById("decoder-frame");
	return e == null ? null : window.getComputedStyle(e).display != "none";
}
function ec(e) {
	let t = document.getElementById("decoder-frame");
	if (t != null) {
		let n = "https://www.decrypt.fun/index.html", r = t.getAttributeNS("", "data-decoder-mode");
		r != null && (n = "https://www.decrypt.fun/" + r + ".html"), t.style.display = e ? "block" : "none", (t.src === "" || e) && (t.src = n);
	}
}
function tc(e, t) {
	let n = document.getElementById("decoder-frame");
	n ?? (n = document.createElement("iframe"), n.id = "decoder-frame", n.style.display = "none", t !== void 0 && t !== !0 && n.setAttributeNS(null, "data-decoder-mode", t), document.getElementsByTagName("body")[0]?.appendChild(n));
	let r = document.getElementById("decoder-toggle");
	r == null && e != null && (r = document.createElement("span"), r.id = "decoder-toggle", r.title = "Open a helpful decoder at right", e.appendChild(r)), r && ($s() ? r.innerText = "Hide Decoders" : r.innerText = "Show Decoders", r.addEventListener("click", nc));
}
function nc(e) {
	var t = $s();
	t === null && tc(null), ec(!t);
}
function rc(e) {
	$s() === null && tc(null), ec(e);
}
//#endregion
//#region src/tableBuilder.ts
function ic(e) {
	return document.createElement("tr");
}
function ac(e) {
	let t = document.getElementById(e.rootId);
	e.onRoot && e.onRoot(t);
	let n = e.data ? e.data.length : e.height;
	for (let r = 0; r < n; r++) {
		let n = t;
		if (e.onRow) {
			let i = e.onRow(r);
			if (!i) continue;
			t?.appendChild(i), n = i;
		}
		let i = e.data ? e.data[r].length : e.width;
		for (let t = 0; t < i; t++) {
			let i = e.data ? e.data[r][t] : "", a = e.onCell(i, t, r);
			a && n?.appendChild(a);
		}
	}
}
var oc = "http://www.w3.org/2000/svg", sc = "http://www.w3.org/2000/xmlns";
function cc(e, t, n, r, i) {
	if (e == " ") return null;
	var a = document.createElementNS(oc, "g");
	a.classList.add("vertex-g"), r && J(a, r), a.setAttributeNS("", "transform", "translate(" + t + ", " + n + ")");
	var o = document.createElementNS(oc, "rect");
	o.classList.add("vertex");
	var s = document.createElementNS(oc, "text");
	if (s.appendChild(document.createTextNode(e)), a.appendChild(o), a.appendChild(s), i) {
		var c = document.createElementNS(oc, "g");
		c.classList.add("fo-stampable");
		var l = document.createElementNS(oc, "foreignObject"), u = document.createElement("div");
		u.setAttribute("xmlns", sc), u.classList.add("stampable"), l.appendChild(u), c.appendChild(l), a.appendChild(c);
	}
	return a;
}
function lc(e, t, n, r, i) {
	var a = document.createElementNS(oc, "g");
	r && (a.id = r), a.classList.add("vertex-g"), i && J(a, i), a.setAttributeNS("", "transform", "translate(" + t + ", " + n + ")");
	var o = document.createElementNS(oc, "rect");
	o.classList.add("vertex");
	var s = document.createElementNS(oc, "image");
	return s.setAttributeNS("", "href", e), a.appendChild(o), a.appendChild(s), a;
}
function uc() {
	var e = document.createElementNS(oc, "foreignObject");
	e.classList.add("fo-stampable");
	var t = document.createElement("div");
	return t.setAttribute("xmlns", sc), t.classList.add("stampable"), e.appendChild(t), e;
}
//#endregion
//#region src/subway.ts
function dc() {
	let e = document.getElementsByClassName("subway");
	for (let t = 0; t < e.length; t++) hc(e[t]);
}
function fc(e, t) {
	return !t || t < e ? e : t;
}
function pc(e, t) {
	return !t || t > e ? e : t;
}
function mc(e, t) {
	if (!t) return new DOMRect(e.x, e.y, 0, 0);
	let n = pc(t.left, e.x), r = fc(t.right, e.x), i = pc(t.top, e.y), a = fc(t.bottom, e.y);
	return new DOMRect(n, i, r - n, a - i);
}
function B(e) {
	return Math.round(e * 10) / 10;
}
function hc(e) {
	let t = gc(e);
	if (t ||= vc(e), t) {
		let n = "http://www.w3.org/2000/svg", r = document.createElementNS(n, "svg"), i = document.createElementNS(n, "path");
		i.setAttributeNS(null, "d", t.path_d), r.appendChild(i), r.setAttributeNS(null, "width", B(t.bounds.right - t.origin.x - t.shift.x + 2) + "px"), r.setAttributeNS(null, "height", B(t.bounds.bottom - t.origin.y - t.shift.y + 2) + "px"), e.appendChild(r), t.shift.x != 0 && (e.style.left = B(t.shift.x) + "px"), t.shift.y != 0 && (e.style.top = B(t.shift.y) + "px");
	}
}
function gc(e) {
	let t = e.getBoundingClientRect(), n = e.getAttributeNS("", "data-left-end") || "", r = e.getAttributeNS("", "data-right-end") || "";
	if (n.length == 0 && r.length == 0) return;
	let i = e.getAttributeNS("", "data-left-id"), a = e.getAttributeNS("", "data-right-id");
	n = _c(i, n), r = _c(a, r);
	let o, s = [], c = [], l = r.split(" ");
	for (let e = 0; e < l.length; e++) {
		let n = yc(l[e], "left");
		o = mc(n, o), c.push(B(n.y - t.top));
	}
	let u = n.split(" ");
	for (let e = 0; e < u.length; e++) {
		let n = yc(u[e], "right");
		o = mc(n, o), s.push(B(n.y - t.top));
	}
	if (!o) return;
	let d = pc(0, o.left - t.left), f = fc(0, B(o.left - t.left - d)), p = B(o.left + o.width - t.left - d), m = e.getAttributeNS("", "data-center-line"), h;
	h = m ? m.indexOf("%") == m.length - 1 ? B(parseInt(m) * o.width / 100) : parseInt(m) : o.width / 2;
	let ee = "";
	if (o.height <= 2.5 && s.length == 1 && c.length == 1) ee = "M" + f + "," + s[0] + " L" + p + c[0];
	else {
		let e = "M" + f + "," + s[0] + " L" + h + "," + s[0] + " L" + h + "," + c[c.length - 1] + " L" + p + "," + c[c.length - 1];
		(s.length > 0 || c.length > 0) && (e += "M" + f + "," + s[s.length - 1] + " L" + h + "," + s[s.length - 1] + " L" + h + "," + c[0] + " L" + p + "," + c[0]);
		for (let t = 1; t < s.length - 1; t++) e += "M" + f + "," + s[t] + " L" + h + "," + s[t] + " L" + h + "," + c[0];
		for (let t = 1; t < c.length - 1; t++) e += "M" + p + "," + c[t] + " L" + h + "," + c[t] + " L" + h + "," + s[0];
	}
	return {
		origin: t,
		path_d: ee,
		bounds: o,
		shift: new DOMPoint(d, 0)
	};
}
function _c(e, t) {
	return !e || !t ? t : t.split(" ").map((t) => e + "." + t).join(" ");
}
function vc(e) {
	let t = e.getBoundingClientRect(), n = e.getAttributeNS("", "data-top-end") || "", r = e.getAttributeNS("", "data-bottom-end") || "";
	if (n.length == 0 && r.length == 0) return;
	let i = e.getAttributeNS("", "data-top-id"), a = e.getAttributeNS("", "data-bottom-id");
	n = _c(i, n), r = _c(a, r);
	let o, s = [], c = [];
	if (r.length > 0) {
		let e = r.split(" ");
		for (let n = 0; n < e.length; n++) {
			let r = yc(e[n], "top");
			o = mc(r, o), c.push(B(r.x - t.left));
		}
	}
	if (n.length > 0) {
		let e = n.split(" ");
		for (let n = 0; n < e.length; n++) {
			let r = yc(e[n], "bottom");
			o = mc(r, o), s.push(B(r.x - t.left));
		}
	}
	if (!o) return;
	let l = e.getAttributeNS("", "data-center-line"), u;
	l ? l.indexOf("%") == l.length - 1 ? u = B(parseInt(l) * o.height / 100) : (u = parseInt(l), o.height <= u && (s.length == 0 && (o.y -= u + 1), o.height = u + 1)) : u = o.height / 2;
	let d = pc(0, o.top - t.top), f = fc(0, B(o.top - t.top - d)), p = B(o.top + o.height - t.top - d), m = "";
	if (o.width <= 2.5 && s.length == 1 && c.length == 1) m = "M" + s[0] + "," + f + " L" + c[0] + "," + p;
	else {
		m = "M" + B(o.left - t.left) + "," + u + " h" + B(o.width);
		for (let e = 0; e < s.length; e++) m += " M" + s[e] + "," + u + " v" + -u;
		for (let e = 0; e < c.length; e++) m += " M" + c[e] + "," + u + " v" + B(o.height - u);
	}
	return {
		origin: t,
		path_d: m,
		bounds: o,
		shift: new DOMPoint(0, d)
	};
}
function yc(e, t) {
	let n = e.split("."), r = document.getElementById(n[0]);
	n.length > 1 && (r = r.getElementsByClassName("letter-cell")[parseInt(n[1]) - 1]);
	let i = r.getBoundingClientRect();
	return t == "left" ? new DOMPoint(i.left, i.top + 1 + i.height / 2) : t == "right" ? new DOMPoint(i.right, i.top - 1 + i.height / 2) : t == "top" ? new DOMPoint(i.left + 1 + i.width / 2, i.top) : t == "bottom" ? new DOMPoint(i.left - 1 + i.width / 2, i.bottom) : new DOMPoint(i.left - 1 + i.width / 2, i.top - 1 + i.height / 2);
}
//#endregion
//#region src/testUtils.ts
function bc(e, t) {
	return e.left == t.left && e.right == t.right && e.top == t.top && e.bottom == t.bottom;
}
function xc(e) {
	return {
		left: Math.round(e.left * 10) / 10,
		right: Math.round(e.right * 10) / 10,
		top: Math.round(e.top * 10) / 10,
		bottom: Math.round(e.bottom * 10) / 10
	};
}
function Sc(e) {
	let t = e?.left ?? 0, n = e?.right ?? 0;
	return {
		left: t,
		right: t,
		top: n,
		bottom: n
	};
}
function Cc(e, t) {
	t === void 0 && (t = 0);
	let n = {
		index: t,
		nodeType: e.nodeType,
		descendents: e.childNodes.length
	};
	if (e.nodeType == Node.ELEMENT_NODE) {
		let t = e;
		n.bounds = xc(t.getBoundingClientRect()), t.id && (n.id = t.id);
		let r = [];
		for (let t = 0; t < e.childNodes.length; t++) {
			let i = e.childNodes[t], a = Cc(i, t);
			r.push(a), n.descendents += a.descendents;
		}
		n.children = r;
	} else if (e.nodeType != Node.COMMENT_NODE && e.textContent) {
		n.text = e.textContent;
		var r = document.createRange();
		r.selectNode(e);
		let t = r.getBoundingClientRect();
		r.detach(), n.bounds = xc(t);
	}
	return n;
}
function wc() {
	let e = document.getElementById("pageBody");
	if (e) return e;
	let t = document.getElementsByTagName("body");
	return t && t.length > 0 ? t[0] : document.getRootNode();
}
function Tc() {
	return Cc(wc());
}
function Ec(e, t) {
	return e.nodeType == t.nodeType && e.tagName == t.tagName && e.id == t.id;
}
function Dc(e, t, n) {
	for (; n < t.length; n++) if (Ec(e, t[n])) return n;
	return -1;
}
function Oc(e, t) {
	let n = [], r = 0;
	if (e.text != t.text && (r |= 16), (e.bounds || t.bounds) && (!e.bounds || !t.bounds || !bc(e.bounds, t.bounds)) && (r |= 32), e.children && t.children) {
		let i = 0, a = 0;
		for (; i < e.children.length || a < t.children.length;) {
			let o = a >= t.children.length ? e.children.length : Dc(t.children[a], e.children, i);
			if (o < 0) {
				r |= 4;
				let e = {
					diffType: 1,
					after: t.children[a]
				};
				n.push(e), a++;
			} else {
				for (; i < o; i++) {
					r |= 8;
					let t = {
						diffType: 2,
						before: e.children[i]
					};
					n.push(t);
				}
				if (a < t.children.length) {
					let r = Oc(e.children[i], t.children[a]);
					for (let e = 0; e < r.length; e++) n.push(r[e]);
					i++, a++;
				}
			}
		}
	} else e.children ? r |= 8 : t.children && (r |= 4);
	if (r != 0) {
		let i = {
			diffType: r,
			before: e,
			after: t
		};
		n.push(i);
	}
	return n;
}
function kc(e) {
	let t = document.getElementById("render-diffs");
	t || (t = document.createElement("div"), t.id = "render-diffs", document.getElementsByTagName("body")[0].appendChild(t));
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		Ac(t, r);
	}
}
function Ac(e, t) {
	if (!t?.after?.bounds && !t?.before?.bounds) return;
	let n = document.createElement("div");
	K(n, "diff-div", !0), K(n, "diff-add", (t.diffType & 1) != 0), K(n, "diff-rem", (t.diffType & 2) != 0), K(n, "diff-text", (t.diffType & 16) != 0), K(n, "diff-rect", (t.diffType & 32) != 0);
	let r = t.before?.bounds ?? Sc(t.after?.bounds), i = t.after?.bounds ?? Sc(t.before?.bounds);
	n.style.left = i.left + "px", n.style.top = i.top + "px", n.style.width = i.right - i.left + "px", n.style.height = i.bottom - i.top + "px", r.left != i.left && n.appendChild(jc(r.left - i.left, "left")), r.top != i.top && n.appendChild(jc(r.top - i.top, "top")), r.right != i.right && n.appendChild(jc(r.right - i.right, "right")), r.bottom != i.bottom && n.appendChild(jc(r.bottom - i.bottom, "bottom")), e.appendChild(n);
}
function jc(e, t) {
	let n = document.createElement("div");
	return K(n, "diff-shrink", e < 0), K(n, "diff-grow", e > 0), t == "left" ? (n.style.left = (e < 0 ? e : 0) + "px", n.style.width = Math.abs(e) + "px", n.style.top = "0px", n.style.height = "100%") : t == "top" ? (n.style.top = (e < 0 ? e : 0) + "px", n.style.height = Math.abs(e) + "px", n.style.left = "0px", n.style.width = "100%") : t == "right" ? (n.style.right = (e > 0 ? e : 0) + "px", n.style.width = Math.abs(e) + "px", n.style.top = "0px", n.style.height = "100%") : t == "bottom" && (n.style.bottom = (e > 0 ? e : 0) + "px", n.style.height = Math.abs(e) + "px", n.style.left = "0px", n.style.width = "100%"), n;
}
//#endregion
//#region src/dragDropSvg.ts
var V = null, Mc = null;
function Nc(e) {
	let t = document.getElementById(e);
	if (t != null) t.addEventListener("pointerleave", Hc), t.addEventListener("pointermove", Lc), t.addEventListener("pointerup", Vc), t.addEventListener("pointerdown", Gc);
	else {
		let n = document.getElementsByClassName(e);
		for (let e = 0; e < n.length; e++) t = n[e], t.addEventListener("pointerleave", Hc), t.addEventListener("pointermove", Lc), t.addEventListener("pointerup", Vc), t.addEventListener("pointerdown", Gc);
	}
	let n = q(t, "free-drop"), r = document.getElementsByClassName("moveable");
	for (let e = 0; e < r.length; e++) {
		let t = r[e], i = Z(t, "transform-copy");
		if (i == t && !n && console.warn("Usually, the transform-copy node is a parent of the moveable node: " + pe(t)), i) {
			let e = i.getAttributeNS("", "transform-copy");
			qc(i, document.getElementById(e || ""));
		} else n || console.error("Missing transform-copy on " + pe(t));
	}
}
function Pc(e, t, n) {
	let r = Ou(e, "svg").createSVGPoint();
	r.x = t, r.y = n;
	let i = e.getScreenCTM();
	if (!i) return new DOMPoint(NaN, NaN);
	let a = r.matrixTransform(i.inverse());
	return new DOMPoint(a.x, a.y);
}
function Fc(e, t, n) {
	let r = Ou(e, "svg").createSVGPoint();
	r.x = t, r.y = n;
	let i = e.getScreenCTM();
	if (!i) return new DOMPoint(NaN, NaN);
	let a = r.matrixTransform(i);
	return new DOMPoint(a.x, a.y);
}
function Ic(e) {
	e.pointerType != "mouse" && e.preventDefault(), V && Hc(null);
	let t = Rc(e.clientX, e.clientY);
	if (!t) return;
	Kc(t);
	let n = Pc(t, e.clientX, e.clientY), r = zu(t), i = new DOMPoint(r.e, r.f), a = null, o = t.getBoundingClientRect(), s = NaN, c = t.getElementsByClassName("drag-handle");
	for (let t = 0; t < c.length; t++) {
		let n = c[t], r = n.getBoundingClientRect(), i = Math.hypot(r.left + r.width / 2 - e.clientX, r.top + r.height / 2 - e.clientY);
		(a == null || i < s) && (a = n, s = i, o = r);
	}
	let l = zc(o.left + o.width / 2, o.top + o.height / 2);
	Kc(a);
	let u = Z(t, "transform-copy"), d = Z(t, "free-drop");
	V = {
		id: t.id,
		mover: t,
		handle: a || t,
		transformer: u,
		bounds: o,
		undo: {
			transformer: u ? Yc(u) : void 0,
			mover: Yc(t),
			zOrder: Vu(u || t)
		},
		hover: l,
		client: new DOMPoint(e.clientX, e.clientY),
		offset: n,
		translation: i,
		click: !0,
		freeDrop: d
	}, Hu(V.transformer ? V.transformer : V.mover, -1), K(t, "dragging", !0), K(t, "selected", !0);
}
function Lc(e) {
	if (V) {
		e.pointerType != "mouse" && e.preventDefault();
		var t = Bc(e.clientX, e.clientY);
		V.click && t && t.drag && (V.click = !1, K(V.mover, "droppable", !0)), t && t.target && t.target != V.hover && (V.hover && K(V.hover, "hover", !1), V.hover = t.target, K(V.hover, "hover", !0), V.transformer && qc(V.transformer, t.target));
		let n = Pc(V.mover, e.clientX, e.clientY);
		n.x -= V.offset.x, n.y -= V.offset.y, V.mover.style.transform += "translate(" + n.x + "px," + n.y + "px)";
	}
}
function Rc(e, t) {
	let n = document.elementsFromPoint(e, t);
	for (let e = 0; e < n.length; e++) {
		let t = n[e], r = Z(t, "moveable");
		if (r != null) return r;
	}
	return null;
}
function zc(e, t) {
	let n = document.elementsFromPoint(e, t);
	for (let e = 0; e < n.length; e++) {
		let t = n[e];
		if (Z(t, "drag-handle") || Z(t, "moveable")) continue;
		let r = Z(t, "drop-target");
		if (r || (r = Z(t, "drag-source"), !V || r && (!r.id || r.id == V.id + "-source"))) return r;
		if (V) {
			let e = document.getElementById(V.id + "-source");
			if (e) return e;
		}
	}
	return null;
}
function Bc(e, t) {
	if (V) {
		let n = V.freeDrop ? V.freeDrop : zc(e, t), r = V.handle;
		if (!n) {
			let e = V.mover.getElementsByClassName("drag-handle");
			for (let t = 0; t < e.length; t++) {
				r = e[t];
				let i = r.getBoundingClientRect();
				if (n = zc(i.left + i.width / 2, i.top + i.height / 2), n != null) break;
			}
		}
		let i = !V.click || n != V.hover || V.freeDrop != null;
		i || (e < V.bounds.left || e > V.bounds.right || t < V.bounds.top || t > V.bounds.bottom) && (i = !0);
		let a = n == null ? new DOMPoint(NaN, NaN) : Fc(n, 0, 0);
		return {
			target: n,
			origin: a,
			handle: r,
			client: new DOMPoint(e, t),
			drag: i
		};
	}
	return null;
}
function Vc(e) {
	if (V) {
		e.pointerType != "mouse" && e.preventDefault();
		let t = Bc(e.clientX, e.clientY);
		if (V.click && (!t || !t.drag)) {
			e.type.endsWith("up") && V.mover.onclick && V.mover.onclick(e), Uc();
			return;
		}
		if (!t || !t.target) {
			Hc(null);
			return;
		}
		if (K(V.mover, "dragging", !1), K(V.mover, "selected", !1), K(V.mover, "droppable", !1), V.hover && K(V.hover, "hover", !1), q(t.target, "drag-source")) V.mover.style.transform = "";
		else if (q(t.target, "free-drop")) {
			let t = Pc(V.mover.parentNode, e.clientX, e.clientY);
			t.x -= V.offset.x, t.y -= V.offset.y, V.mover.style.transform = "translate(" + t.x + "px," + t.y + "px)";
		} else {
			let e = Fc(t.handle, 0, 0), n = Fc(V.mover, 0, 0), r = Fc(t.target, 0, 0), i = Pc(t.target, r.x + n.x - e.x, r.y + n.y - e.y);
			i.x || i.y ? V.mover.style.transform = "translate(" + i.x + "px," + i.y + "px)" : V.mover.style.transform = "";
		}
		V = null;
	}
}
function Hc(e) {
	if (V) {
		if (e && e.currentTarget && X(e.currentTarget, "svg")) {
			var t = e.currentTarget.getBoundingClientRect();
			if (e.clientX >= t.left && e.clientX <= t.right && e.clientY >= t.top && e.clientY <= t.bottom) return;
		}
		K(V.mover, "dragging", !1), K(V.mover, "selected", !1), K(V.mover, "droppable", !1), V.hover && K(V.hover, "hover", !1);
		let n = Z(V.mover, "transform-copy");
		V.undo.transformer && Xc(n, V.undo.transformer), Xc(V.mover, V.undo.mover), V.translation.x || V.translation.y ? V.mover.style.transform = "translate(" + V.translation.x + "px," + V.translation.y + "px)" : V.mover.style.transform = "", V = null;
	}
}
function Uc() {
	V && (Mc = V, Hc(null), K(Mc.mover, "selected", !0));
}
function Wc() {
	Mc &&= (V = Mc, null);
}
function Gc(e) {
	let t = Rc(e.clientX, e.clientY);
	if (Mc && (Wc(), t != V?.mover)) if (!Bc(e.clientX, e.clientY)) Hc(null);
	else {
		Lc(e), Vc(e);
		return;
	}
	t && (Kc(t), Ic(e));
}
function Kc(e) {
	if (e) {
		var t = e.getBoundingClientRect(), n = Fc(e, 0, 0);
		(n.x < t.left || n.x > t.right || n.y < t.top || n.y > t.bottom) && console.error(`WARNING: <${pe(e)}> has origin (${n.x},${n.y}) outside its bounds: (left=${t.left},top=${t.top},right=${t.right},bottom=${t.bottom}).`);
	}
}
function qc(e, t) {
	let n = Bu(e, t);
	n && Xc(e, Jc(t, n));
}
function Jc(e, t) {
	if (!t.contains(e)) throw Error("container must be an ancestor of child");
	let n = new DOMMatrix(), r = e;
	for (; r && r !== t;) n = Yc(r).multiply(n), r = r.parentElement;
	return n;
}
function Yc(e) {
	let t = getComputedStyle(e);
	return t.transform === "none" ? new DOMMatrix() : new DOMMatrix(t.transform);
}
function Xc(e, t) {
	e.style.transform = `matrix(${t.a}, ${t.b}, ${t.c}, ${t.d}, ${t.e}, ${t.f})`;
}
//#endregion
//#region src/boilerplate.ts
var H = {}, Zc;
function Qc() {
	if (!(Object.keys(H).length > 0)) {
		var e = window.location.search;
		if (e !== "") {
			e = e.substring(1);
			var t = e.split("&");
			for (let e = 0; e < t.length; e++) {
				var n = t[e].split("=");
				n.length > 1 ? H[n[0].toLowerCase()] = n[1] : H[n[0].toLowerCase()] = !0;
			}
		}
		H["body-debug"] != null && H["body-debug"] !== !1 && K(document.getElementsByTagName("body")[0], "debug", !0), H["compare-layout"] != null && U("../Css/TestLayoutDiffs.css");
		var r = navigator.userAgent.match(/iPad/i) != null;
		K(document.getElementsByTagName("body")[0], "iPad", r);
	}
}
function $c(e) {
	return H[e] !== void 0;
}
function el() {
	return H.debug != null && H.debug !== !1;
}
function tl() {
	return H.trace != null && H.trace !== !1;
}
function nl() {
	return q(document.getElementsByTagName("body")[0], "debug");
}
function rl() {
	return H.iframe != null && H.iframe !== !1;
}
function il() {
	return H.print != null && H.print !== !1;
}
function al() {
	return H.icon != null && H.icon !== !1;
}
function ol() {
	return H.modal != null && H.modal !== !1;
}
function sl() {
	return W().reloadOnRefresh === void 0 ? H.restart != null && H.restart !== !1 : !W().reloadOnRefresh;
}
function cl() {
	if (W().reloadOnRefresh !== void 0) return W().reloadOnRefresh;
	if (H.reload != null) return H.reload !== !1;
}
var ll = {
	id: "printAs",
	html: "<div style='color:#666;'>Print as <span style='color:#FF0000;'>c</span><span style='color:#538135;'>o</span><span style='color:#00B0F0;'>l</span><span style='color:#806000;'>o</span><span style='color:#7030A0;'>r</span>.</div>"
}, ul = {
	id: "printAs",
	text: "<div style='color:#666;'>Print as grayscale</div>"
};
function dl(e) {
	Zc = document.documentElement.outerHTML, Qc();
	let t = Ot(e);
	var n = document.getElementsByTagName("body");
	rl() && n[0].classList.add("iframe"), il() && n[0].classList.add("print"), al() && n[0].classList.add("icon"), e.pathToRoot && (t.logo &&= e.pathToRoot + "/" + t.logo, t.icon &&= e.pathToRoot + "/" + t.icon, t.puzzleList &&= e.pathToRoot + "/" + t.puzzleList);
}
function fl({ id: e, cls: t, text: n, html: r }) {
	let i = document.createElement("div");
	return e !== void 0 && (i.id = e), t !== void 0 && i.classList.add(t), n === void 0 ? r !== void 0 && (i.innerHTML = r) : i.appendChild(document.createTextNode(n)), i;
}
var pl = {
	Word: "Word puzzle",
	Math: "Math puzzle",
	Rebus: "Rebus puzzle",
	Code: "Features encodings",
	Trivia: "Trivia puzzle",
	Meta: "Meta puzzle",
	Reassemble: "Assembly"
};
function ml(e) {
	let t = document.createElement("img");
	return t.id = "qr", e.endsWith(".png") || (t.src = "data:image/png;base64," + e), t.alt = "QR code to online page", t;
}
function hl() {
	let e = w();
	if (e.qr_folders) {
		let t = window.location.href;
		for (let n of Object.keys(e.qr_folders)) if (t.indexOf(n) == 0) {
			let t = e.qr_folders[n], r = window.location.pathname.split("/"), i = r[r.length - 1].split(".")[0];
			return t.includes("{}") ? t.replace("{}", i) : (t.endsWith("/") || (t += "/"), t + i + ".png");
		}
	}
}
function gl() {
	let e = hl();
	if (e) {
		let t = document.createElement("img");
		return t.id = "qr", t.src = e, t.alt = "QR code to online page", t;
	}
	return null;
}
function _l(e, t = "") {
	t ||= "puzzle";
	let n = document.createElement("div");
	n.id = "icons";
	let r = document.createElement("img");
	return r.id = "icons-" + n.childNodes.length, r.src = w().iconRoot + e.toLocaleLowerCase() + ".png", r.alt = pl[e] || e + " " + t, n.appendChild(r), n;
}
function vl(e) {
	if (!e) return;
	if (Al = e, dl(e), e.preBuild && e.preBuild(), e.reactiveBuilder) try {
		su(e.reactiveBuilder);
	} catch (e) {
		let t = _(e);
		console.error(t.stack), (tl() || el()) && K(document.getElementsByTagName("body")[0], "build-error", !0);
	}
	else Kl(document) && console.error(Error("WARNING: this page contains <build>-style elements.\nSet boiler.reactiveBuilder:true to engage."));
	e.tableBuilder && ac(e.tableBuilder);
	let t = document.getElementsByTagName("html")[0], n = document.getElementsByTagName("head")[0], r = document.getElementsByTagName("body")[0], i = document.getElementById("pageBody");
	e.title && (document.title = e.title), t.lang = e.lang || "en-us";
	let a = w();
	for (let e = 0; e < a.links.length; e++) wl(n, a.links[e]);
	let o = document.createElement("meta");
	o.name = "viewport", o.content = "width=device-width, initial-scale=1", n.appendChild(o), a.fontCss && U(a.fontCss);
	let s = e.googleFonts;
	if (a.googleFonts && (s = a.googleFonts + (s ? "," + s : "")), s && (wl(n, {
		rel: "preconnect",
		href: "https://fonts.googleapis.com"
	}), wl(n, {
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossorigin: ""
	}), wl(n, {
		href: "https://fonts.googleapis.com/css2?family=" + s.split(",").join("&family=") + "&display=swap",
		rel: "stylesheet"
	})), U(a.cssRoot + "PageSizes.css"), U(a.cssRoot + "TextInput.css"), e.paperSize ||= "letter", e.orientation ||= "portrait", e.paperSize.indexOf("|") > 0) {
		let t = e.paperSize.split("|");
		e.paperSize = il() ? t[1] : t[0];
	}
	K(r, e.paperSize), K(r, e.orientation), K(r, "_" + e.safari), Xt(a.eventSync, a.usageSync);
	let c = fl({
		id: "page",
		cls: "printedPage"
	}), l = fl({ cls: "pageWithinMargins" });
	r.appendChild(c), c.appendChild(l), l.appendChild(i), e.title ? l.appendChild(fl({
		cls: "title",
		text: e.title
	})) : K(r, "no-title", !0), (e.copyright || e.author) && l.appendChild(fl({
		id: "copyright",
		text: "Â© " + (e.copyright || "") + " " + (e.author || "")
	}));
	let u = kt();
	if (u && l.appendChild(u), e.printAsColor !== void 0 && l.appendChild(fl(e.printAsColor ? ll : ul)), a.icon) {
		let e = document.createElement("link");
		e.rel = "shortcut icon", e.type = "image/png", e.href = a.icon, n.appendChild(e);
	}
	if (e.qr_base64) l.appendChild(ml(e.qr_base64));
	else if (e.print_qr) {
		let e = gl();
		e && l.appendChild(e);
	}
	e.type && l.appendChild(_l(e.type)), e.feeder && l.appendChild(_l(e.feeder, "feeder")), e.preSetup && e.preSetup(), Dl(n, l, e.abilities || {}), jt() && Bn() && (U(a.cssRoot + "Guesses.css"), wn()), a?.ratings && (U(a.cssRoot + "Ratings.css"), Nt(a?.ratings, l)), rl() || setTimeout(Wi, 100);
}
function yl() {
	if (H["scan-layout"] != null) {
		let e = Tc(), t = JSON.stringify(e), n = document.createComment(t);
		document.getRootNode().appendChild(n);
	}
	if (H["compare-layout"] != null) {
		let e = Tc(), t = document.getRootNode();
		for (let n = 0; n < t.childNodes.length; n++) if (t.childNodes[n].nodeType == Node.COMMENT_NODE) {
			let r = t.childNodes[n].textContent;
			if (r && (r = r.trim(), r.substring(0, 7) == "layout=")) {
				let t = Oc(Gi(r.substring(7)), e);
				t.length > 0 && kc(t);
				break;
			}
		}
	}
}
function bl() {
	return document.getElementsByTagName("head")[0];
}
function xl() {
	let e = document.getElementsByTagName("base");
	for (let n = 0; n < e.length; n++) {
		var t = e[n].getAttribute("href");
		if (t) return Sl(t, document.location.href || "");
	}
	return document.location.href;
}
function Sl(e, t) {
	let n = e.split("/");
	if (n[0].length == 0 || n[0].indexOf(":") >= 0) return e;
	t === void 0 && (t = xl());
	let r = t.split("/");
	r.pop();
	let i = 0;
	for (; i < n.length; i++) if (n[i] == "..") {
		if (r.length == 0 || r.length == 1 && r[0].indexOf(":") > 0) throw Error("Relative path beyond base: " + e);
		r.pop();
	} else n[i] != "." && r.push(n[i]);
	return r.join("/");
}
var Cl = 1;
function wl(e, t) {
	e ||= bl();
	let n = document.createElement("link");
	n.href = Sl(t.href), n.rel = t.rel, t.type && (n.type = t.type), t.crossorigin != null && (n.crossOrigin = t.crossorigin), t.rel.toLowerCase() == "stylesheet" && (n.onload = function() {
		El();
	}, Cl++), e.appendChild(n);
}
var Tl = {};
function U(e, t) {
	if (e in Tl) return;
	Tl[e] = !0, t ||= bl();
	let n = document.createElement("link");
	n.href = Sl(e), n.rel = "Stylesheet", n.type = "text/css", n.onload = function() {
		El();
	}, Cl++, t.appendChild(n);
}
function El() {
	--Cl == 0 && Ol(W());
}
function Dl(e, t, n) {
	let r = w(), i = t.parentNode || document.getElementById("page") || t;
	n.textInput !== !1 && (Ds(), n.textInput == "nearest" && Hs(i));
	let a = document.getElementById("ability");
	if (a != null) {
		let e = a.innerText;
		e.search("âœ”ï¸") >= 0 && (n.checkMarks = !0), e.search("ðŸ’¡") >= 0 && (n.highlights = !0), e.search("ðŸ‘ˆ") >= 0 && (n.dragDrop = !0), e.search("âœ’ï¸") >= 0 && (n.stamping = !0);
	} else a = document.createElement("div"), a.id = "ability", i.appendChild(a);
	let o = "", s = 0;
	if (n.checkMarks && (ao(), o += "<span id=\"check-ability\" title=\"Click items to check them off\">âœ”ï¸</span>", s++), n.highlights) {
		let e = "Ctrl+click to highlight cells";
		W()?.abilities?.textInput && (e = "Type ` or ctrl+click to highlight cells"), o += "<span id=\"highlight-ability\" title=\"" + e + "\" style=\"text-shadow: 0 0 3px black;\">ðŸ’¡</span>", so(), s++;
	}
	n.dragDrop !== void 0 && n.dragDrop !== !1 && (o += "<span id=\"drag-ability\" title=\"Drag &amp; drop enabled\" style=\"text-shadow: 0 0 3px black;\">ðŸ‘ˆ</span>", n.dragDrop, Nc(n.dragDrop), va(), U(r.cssRoot + "DragDropSvg.css"), s++), n.stamping && (o += "<span id=\"stamp-ability\" title=\"Click on objects to interact\"><img id=\"stamp-ability-icon\" src=\"../Images/Stamps/stamp-glow.png\" style=\"height:22px;\" /></span>", dr(), ya(), U(r.cssRoot + "StampTools.css")), n.straightEdge && (o += "<span id=\"drag-ability\" title=\"Line-drawing enabled\" style=\"text-shadow: 0 0 3px black;\">ðŸ“</span>", zr(Ur.straightEdge, !1), U(r.cssRoot + "StraightEdge.css")), n.wordSearch && (o += "<span id=\"drag-ability\" title=\"word-search enabled\" style=\"text-shadow: 0 0 3px black;\">ðŸ’Š</span>", zr(Ur.wordSelect, !0), U(r.cssRoot + "WordSearch.css")), n.hashiBridge && (zr(Ur.hashiBridge, !0), U(r.cssRoot + "HashiBridge.css")), n.subway && U(r.cssRoot + "Subway.css"), n.notes && Xa(t), n.scratchPad && (Ti(), o += "<span id=\"highlight-ability\" title=\"Ctrl+click anywhere on the page to create a note.\" style=\"text-shadow: 0 0 3px black;\">ðŸ“”</span>"), n.decoder && tc(i, n.decoder), a.innerHTML = o, a.style.bottom = n.decoder ? "4pt" : "20pt", s == 2 && (a.style.right = "0.6in"), El();
}
function Ol(e) {
	e.abilities && e.abilities.subway && dc(), e.postSetup && e.postSetup(), e.metaParams && hn(e.metaParams), yl();
}
function kl() {
	if (typeof boiler < "u") return boiler;
}
var Al = {};
function W() {
	return Al;
}
function jl(e) {
	vl(e);
}
typeof window < "u" && window.addEventListener("load", function(e) {
	vl(kl());
});
//#endregion
//#region src/builderFor.ts
function Ml(e) {
	let t = [];
	G(t, gu(pe(e)));
	let n = null, r = [], i = [];
	if (n = Nl(e, "each"), n) r = Pl(e);
	else if (n = Nl(e, "char"), n) r = Fl(e, "");
	else if (n = Nl(e, "word"), n) r = Fl(e, " ");
	else if (n = Nl(e, "key"), n) r = Ll(e), i = r[1], r = r[0];
	else if (n = Nl(e, "range") || Nl(e, "int"), n) r = Il(e);
	else throw new g("Unrecognized <for> tag type", v(e));
	if (!r) throw new g("Unable to determine loop", v(e));
	G(t, gu("Iterating " + n + " over " + r.length + " items...")), $l(e);
	let a = ye(), o = n + "#";
	for (let s = 0; s < r.length; s++) G(t, gu(n + " #" + s + " == " + JSON.stringify(r[s]))), a[o] = s, a[n] = r[s], i.length > 0 && (a[n + "!"] = i[s]), G(t, lu(e));
	return be(), eu(), t;
}
function Nl(e, t) {
	let n = e.getAttributeNS("", t);
	if (!n) return null;
	if (/^[a-zA-Z]+$/.test(n)) return n;
	throw new g("For loop iteration variable must be a single word: " + n, v(e, t));
}
function Pl(e) {
	let t = b(e, "in", !0);
	if (Array.isArray(t)) return t;
	throw b(e, "in", !0), new g("For each's in attribute must indicate a list", y(e, "in"));
}
function Fl(e, t) {
	let n = v(e, "in"), r = Ve(b(e, "in", !0), n);
	return t == "" ? pu(r) : r.split(t);
}
function Il(e) {
	let t = b(e, "from", !0, !1), n = b(e, "until", !0, !1), r = b(e, "to", !0, !1), i = b(e, "len", !0, !1), a = b(e, "step", !0, !1), o = t ? Be(t, y(e, "from")) : 0, s = n ? Be(n, y(e, "until")) : r ? Be(r, y(e, "last")) + 1 : i ? Ve(i, y(e, "len")).length : o, c = a ? Be(a, y(e, "step")) : 1;
	if (c == 0) throw new g("Invalid loop step. Must be non-zero.", y(e, "step"));
	!n && c < 0 && (s -= 2);
	let l = [];
	for (let e = o; c > 0 ? e < s : e > s; e += c) l.push(e);
	return l;
}
function Ll(e) {
	let t = b(e, "in", !0);
	try {
		let e = Object.keys(t);
		return [e, e.map((e) => t[e])];
	} catch (n) {
		throw new g("Not an object with keys: " + t, v(e, "in"), n);
	}
}
//#endregion
//#region src/builderIf.ts
function Rl(e, t) {
	let n = [];
	try {
		if (me(e, n, !0), X(e, "if")) t.index = 1, t.passed = !1;
		else {
			if (t.index < 1) throw new g(e.tagName + " without preceding <if>", v(e));
			if (X(e, "else") ? t.index = -t.index : t.index++, t.passed) return [];
		}
		let r = b(e, "exists", !1, !1, !1), i = b(e, "notex", !1, !1, !0), a = b(e, "not", !0, !1), o = b(e, "test", !0, !1);
		if (X(e, "else")) t.passed = !0;
		else if (e.hasAttributeNS("", "exists") || e.hasAttributeNS("", "notex")) r === !1 || i === !0 ? t.passed = i ? !0 : r : e.hasAttributeNS("", "exists") ? t.passed = r : t.passed = !i;
		else if (a !== void 0) t.passed = a === "false" || a === "" || a === null;
		else if (o !== void 0) {
			let n = y(e, "test"), r;
			if ((r = b(e, "eq", !1, !1)) !== void 0) t.passed = o === r;
			else if ((r = b(e, "ne", !1, !1)) !== void 0) t.passed = o !== r;
			else if ((r = b(e, "lt", !1, !1)) != null) t.passed = x(o, n) < x(r, y(e, "lt"));
			else if ((r = b(e, "le", !1, !1)) != null) t.passed = x(o, n) <= x(r, y(e, "le"));
			else if ((r = b(e, "gt", !1, !1)) != null) t.passed = x(o, n) > x(r, y(e, "gt"));
			else if ((r = b(e, "ge", !1, !1)) != null) t.passed = x(o, n) >= x(r, y(e, "ge"));
			else if ((r = b(e, "in", !1, !1)) != null) if (Array.isArray(r)) t.passed = r.indexOf(o) >= 0;
			else if (typeof r == "string") t.passed = r.indexOf(o) >= 0;
			else if (typeof r == "object") t.passed = o in r;
			else throw new g(typeof r + " value does not support 'in' queries", v(e, "in"));
			else if (r = b(e, "ni", !1, !1)) if (Array.isArray(r)) t.passed = r.indexOf(o) < 0;
			else if (typeof r == "string") t.passed = r.indexOf(o) < 0;
			else if (typeof r == "object") t.passed = !(o in r);
			else throw new g(typeof r + " value does not support 'not-in' queries", v(e, "in"));
			else (r = b(e, "regex", !1, !1)) ? t.passed = new RegExp(r).test(o) : t.passed = o === !0 || o === "true";
		} else throw new g("<" + e.localName + "> elements must have an evaluating attribute: test, not, exists, or notex");
	} catch (t) {
		let n = _(t, "startIfBlock", v(e));
		if (ru(n, e)) throw n;
	}
	return t.passed && ($l(e), G(n, lu(e)), eu()), n;
}
//#endregion
//#region src/builderInput.ts
var zl = [
	"letter",
	"letters",
	"literal",
	"number",
	"numbers",
	"pattern",
	"word",
	"extract"
], Bl = {
	"": {},
	letter: {
		inherit: "",
		spanClass: {
			"": "letter-cell",
			block: "block",
			literal: "literal",
			extract: "extract",
			"copy-id": "copy-extracter"
		},
		spanRename: {
			"extracted-id": "data-extracted-id",
			"copy-id": "data-copy-id"
		},
		optionalStyle: {
			"": "letter",
			literal: "literal",
			extract: "extract"
		},
		specialCases: {
			extract: Vl,
			literal: Hl,
			block: Hl
		}
	},
	letters: {
		inherit: "letter",
		spanClass: { "": "multiple-letter" }
	},
	number: {
		inherit: "letter",
		spanClass: { "": "numeric" }
	},
	numbers: {
		inherit: "number",
		spanClass: { "": "multiple-letter" }
	},
	literal: {
		inherit: "letter",
		spanClass: { "": "literal" },
		optionalStyle: { "": "literal" },
		specialCases: {
			"": Hl,
			block: Hl
		}
	},
	word: {
		inherit: "",
		spanClass: {
			"": "word-cell",
			literal: "literal",
			"copy-id": "copy-extracter"
		},
		spanRename: {
			extract: "data-extract-index",
			"extracted-id": "data-extracted-id",
			"copy-id": "data-copy-id"
		},
		specialCases: {
			literal: Hl,
			block: Hl
		},
		optionalStyle: { "": "word" }
	},
	pattern: {
		inherit: "",
		spanClass: {
			"": "letter-cell-block",
			pattern: "create-from-pattern",
			extracted: "create-from-pattern extracted",
			"extract-numbered": "create-from-pattern extracted",
			"extract-lettered": "create-from-pattern extracted"
		},
		spanRename: {
			pattern: "data-letter-pattern",
			extract: "data-extract-indeces",
			numbers: "data-number-assignments",
			"extracted-id": "data-extracted-id",
			extracted: "data-extracted-pattern",
			"extract-numbered": "data-extract-numbered",
			"extract-lettered": "data-extract-lettered"
		}
	},
	extract: {
		inherit: "",
		spanClass: {
			"": "extract-literal",
			word: "word-input",
			letter: "extract-input",
			letters: "extract-input"
		},
		spanRename: {
			word: "value",
			letter: "value",
			letters: "value",
			"copy-id": "data-copy-id"
		},
		optionalStyle: { "": "hidden" }
	}
};
function Vl(e, t) {
	if (parseInt(e) > 0) {
		K(t, "numbered", !0), K(t, "extract-numbered", !0), t.setAttributeNS("", "data-number", e);
		let n = document.createElement("span");
		K(n, "under-number"), n.innerText = e, t.appendChild(n);
	}
}
function Hl(e, t) {
	e === "Â¤" && (K(t, "block", !0), e = " "), t.appendChild(document.createTextNode(e));
}
function Ul(e) {
	let t = document.createElement("span");
	me(e, t, !0), Ce(e, t);
	let n, r = Bl[e.localName.toLowerCase()];
	for (; r;) {
		if (r.spanClass) {
			r.spanClass[""] && J(t, r.spanClass[""]);
			let n = Object.keys(r.spanClass);
			for (let i = 0; i < n.length; i++) e.getAttributeNS("", n[i]) !== null && J(t, r.spanClass[n[i]]);
		}
		if (r.optionalStyle && !n) {
			let t = Object.keys(r.optionalStyle);
			for (let i = 0; i < t.length; i++) if (e.getAttributeNS("", t[i]) !== null) {
				n = r.optionalStyle[t[i]];
				break;
			}
			!n && "" in r.optionalStyle && (n = r.optionalStyle[""]);
		}
		if (r.spanRename) {
			let n = Object.keys(r.spanRename);
			for (let i = 0; i < n.length; i++) {
				let a = e.getAttributeNS("", n[i]);
				a !== null && t.setAttributeNS("", r.spanRename[n[i]], Ee(a, !1));
			}
		}
		if (r.specialCases) {
			let n = Object.keys(r.specialCases);
			for (let i = 0; i < n.length; i++) {
				let a = e.getAttributeNS("", n[i]);
				if (a !== null) {
					let e = r.specialCases[n[i]];
					e(Ee(a, !1), t);
				}
			}
			if ("" in r.specialCases && e.innerText.length > 0) {
				let n = r.specialCases[""];
				n(Ee(e.innerText, !0), t);
			}
		}
		r = r.inherit ? Bl[r.inherit] : void 0;
	}
	if (n && J(t, ks(e, "underline", "none", "box")[n]), e.localName !== "literal" && e.childNodes.length > 0) throw new g("Input tags like <" + e.localName + "/> should be empty elements", de(e.childNodes[0]));
	return [t];
}
//#endregion
//#region src/builder.ts
var Wl = [
	"build",
	"use",
	"for",
	"if",
	"else",
	"elseif"
];
function Gl() {
	let e = Wl.concat(zl);
	for (let t of e) {
		let e = document.getElementsByTagName(t);
		for (let t = 0; t < e.length; t++) K(e[t], "_builder_control_", !0);
	}
	let t = document.getElementsByClassName("_builder_control_");
	if (t.length == 0) return null;
	let n = t[0];
	for (let e = t.length - 1; e >= 0; e--) K(t[e], "_builder_control_", !1);
	return n;
}
function Kl(e) {
	let t = Wl.concat(zl);
	for (let n = 0; n < t.length; n++) if (e.getElementsByTagName(t[n]).length > 0) return !0;
	return !1;
}
var ql = [], Jl = [], Yl = [];
function Xl(e) {
	Jl = [], ql = [], Yl = [];
	let t = [];
	for (; e !== null && e.nodeName != "#document-fragment" && e.tagName !== "BODY";) t.push(e), e = e.parentElement;
	for (; t.length > 0;) ql.push(t.pop());
}
function Zl(e) {
	Jl.push(e);
}
function Ql() {
	Jl.pop();
}
function $l(e) {
	Yl.push(e);
}
function eu() {
	Yl.pop();
}
var tu = /* @__PURE__ */ function(e) {
	return e[e.off = 0] = "off", e[e.on = 1] = "on", e[e.pre = 2] = "pre", e[e.all = 3] = "all", e;
}({});
function nu() {
	let e = iu((e) => q(e, "trim") || e.getAttributeNS("", "trim") !== null);
	if (e) {
		if (q(e, "trim")) return 1;
		let t = e.getAttributeNS("", "trim");
		if (t = t == null ? null : t.toLowerCase(), t === "all") return 3;
		if (t === "pre") return 2;
		if (t != null) return +(t !== "false" && t !== "off");
	}
	return 0;
}
function ru(e, t, n, r) {
	let i = [
		t,
		n,
		r
	];
	for (let t = 0; t < i.length; t++) {
		let n = i[t];
		if (!n || n.nodeType != Node.ELEMENT_NODE) continue;
		let r = i[t];
		if (q(r, "nothrow") || r.getAttributeNS("", "nothrow") !== null) return console.error(e.stack), !1;
		let a = r.getAttributeNS("", "onthrow");
		if (a) {
			let t = window[a];
			if (t) return console.error(e.stack), t(e, r), !1;
		}
	}
	return !0;
}
function iu(e) {
	for (let t = Jl.length - 1; t >= 0; t--) if (e(Jl[t])) return Jl[t];
	for (let t = ql.length - 1; t >= 0; t--) if (e(ql[t])) return ql[t];
	for (let t = Yl.length - 1; t >= 0; t--) if (e(Yl[t])) return Yl[t];
	return null;
}
function au(e, t) {
	let n = iu(t);
	if (n != null) return n;
	for (; e !== null && e.nodeName != "#document-fragment" && e.tagName !== "BODY";) {
		if (t(e)) return e;
		if (e.parentNode === document) return null;
		e = e.parentElement;
	}
	return null;
}
function ou() {
	let e = iu((e) => X(e, "SVG") || X(e, "FOREIGNOBJECT"));
	return e ? X(e, "SVG") : !1;
}
function su(e) {
	let t = null;
	typeof e == "string" && (t = document.getElementById(e)), t ||= Gl();
	let n = {
		passed: !1,
		index: 0
	};
	for (; t !== null; t = Gl()) try {
		Xl(t);
		let e = [];
		X(t, [
			"if",
			"elseif",
			"else"
		]) ? e = Rl(t, n) : (n.index = 0, e = X(t, "build") ? lu(t) : X(t, "for") ? Ml(t) : X(t, "use") ? er(t) : X(t, zl) ? Ul(t) : [fu(t)]);
		let r = t.parentNode;
		for (let n = 0; n < e.length; n++) {
			let i = e[n];
			r?.insertBefore(i, t);
		}
		r?.removeChild(t);
	} catch (e) {
		let n = _(e, "expandControlTags", v(t));
		if (ru(n, t)) throw n;
	}
	Xl(null);
	let r = W().postBuild;
	r && r();
}
function G(e, t) {
	for (let n = 0; n < t.length; n++) e.push(t[n]);
}
function cu(e, t) {
	for (let n = 0; n < t.length; n++) e.insertBefore(t[n], null);
}
function lu(e) {
	let t = [], n = {
		passed: !1,
		index: 0
	};
	for (let r = 0; r < e.childNodes.length; r++) {
		let i = e.childNodes[r];
		if (i.nodeType == Node.ELEMENT_NODE) {
			let r = i;
			try {
				if (X(r, [
					"if",
					"elseif",
					"else"
				])) {
					G(t, Rl(r, n));
					continue;
				}
				if (n.index = 0, X(r, "for")) G(t, Ml(r));
				else if (X(r, "use")) G(t, er(r));
				else if (X(r, zl)) G(t, Ul(r));
				else if (X(r, "template")) throw new g("Templates get corrupted when inside a build region. Define all templates at the end of the BODY");
				else t.push(fu(r));
			} catch (t) {
				let n = _(t, "expandContents", v(r));
				if (ru(n, r, e)) throw n;
			}
		} else i.nodeType == Node.TEXT_NODE ? G(t, Te(i)) : (uu(i), t.push(mu(i)));
	}
	return t;
}
function uu(e) {
	if (e.nodeType == Node.COMMENT_NODE) {
		let t = e, n = De(t.textContent);
		console.log(typeof n == "string" ? t.textContent + " => " + n : t.textContent + " => " + JSON.stringify(n));
	}
}
function du(e) {
	return e.substring(0, 1) == "_" ? e.substring(1) : e.substring(e.length - 1) == "_" ? e.substring(0, e.length - 1) : e.length >= 2 && e[0] == e[1] ? e.substring(1) : e;
}
function fu(e) {
	let t = du(e.localName), n;
	if (ou() || t == "svg") n = document.createElementNS(oc, t);
	else if (e.getAttribute("xmlns") || e.getAttribute("xxmlns")) {
		let r = e.getAttribute("xmlns") || e.getAttribute("xxmlns");
		n = document.createElementNS(r, t);
	} else n = document.createElement(t);
	Zl(n), Ce(e, n);
	let r = {
		passed: !1,
		index: 0
	};
	for (let t = 0; t < e.childNodes.length; t++) {
		let i = e.childNodes[t];
		try {
			if (i.nodeType == Node.ELEMENT_NODE) {
				let e = i;
				if (X(e, [
					"if",
					"elseif",
					"else"
				])) {
					cu(n, Rl(e, r));
					continue;
				}
				r.index = 0, X(e, "for") ? cu(n, Ml(e)) : X(e, "use") ? cu(n, er(e)) : X(e, zl) ? cu(n, Ul(e)) : n.appendChild(fu(e));
			} else i.nodeType == Node.TEXT_NODE ? cu(n, Te(i)) : (uu(i), n.insertBefore(mu(i), null));
		} catch (t) {
			let n = _(t, "cloneWithContext", de(i));
			if (ru(n, i, e)) throw n;
		}
	}
	return Ql(), n;
}
function pu(e) {
	let t = [], n = 0, r = 0, i = 0;
	for (let a of e) {
		if (r = i, i = a.length == 1 ? a.charCodeAt(0) : a.length == 2 ? 65536 + ((a.charCodeAt(0) & 1023) << 10 | a.charCodeAt(1) & 1023) : -1, i < 0) throw new g("Unexpected unicode combination: " + a + " at byte " + t.join("").length + " in " + e);
		if (i >= 55296 && i <= 57088) throw new g("Unexpected half of unicode surrogate: " + i.toString(16) + " at byte " + t.join("").length + " in " + e);
		if (i >= 127995 && i <= 127999 || i >= 65024 && i <= 65039 ? n += 1 : i == 8205 ? n += 2 : i >= 127462 && i <= 127487 ? r >= 127462 && r <= 127487 && t[t.length - 1].length == 2 && (n += 1) : i >= 917505 && i <= 917631 && r != 917631 && (n += 1), n > 0) {
			if (n--, t.length == 0) throw new g("Unexpected unicode join character " + i.toString(16) + " at byte 0 of " + e);
			a = t.pop() + a;
		}
		t.push(a);
	}
	if (n > 0) throw Error("The final emoji sequence expected " + n + " additional characters");
	return t;
}
function mu(e) {
	return e;
}
function hu(e) {
	tl() && console.log(e);
}
function gu(e) {
	return hu(e), tl() ? [document.createComment(e)] : [];
}
//#endregion
//#region src/classUtil.ts
function K(e, t, n) {
	let r = vu(e);
	!r || !t || r !== null && r.classList !== null && (n === void 0 && (n = !r.classList.contains(t)), n ? r.classList.add(t) : (r.classList.remove(t), r.classList.length == 0 && r.removeAttribute("class")));
}
function _u(e) {
	let t = document.getElementsByClassName(e);
	for (let n = t.length - 1; n >= 0; n--) t[n].classList.remove(e);
}
function vu(e) {
	return e ? typeof e == "string" ? document.getElementById(e) : e : null;
}
function q(e, t) {
	let n = vu(e);
	return !n || !t ? !1 : n !== null && n.classList && n.classList.contains(t);
}
function J(e, t) {
	var n = t.split(" ");
	for (let t of n) K(e, t, !0);
}
function yu(e) {
	let t = vu(e), n = [];
	return t.classList.forEach((e, t) => n.push(e)), n;
}
function bu(e, t) {
	let n = vu(e), r = [];
	t ? r = typeof t == "string" ? t.split(" ") : t : n.classList.forEach((e, t) => r.push(e));
	for (let t of r) K(e, t, !1);
}
function Y(e, t, n, r = 1) {
	var i = document.getElementsByClassName(t), a = !1;
	for (let t = r == 1 ? 0 : i.length - 1; t >= 0 && t < i.length; t += r) if (!(n != null && q(i[t], n))) {
		if (a) return i[t];
		a = i[t] == e;
	}
	return null;
}
function xu(e, t, n) {
	let r;
	r = typeof t == "string" ? Z(e, t) : t;
	var i = r.getElementsByClassName(n);
	for (let t = 0; t < i.length; t++) if (i[t] === e) return t;
	return -1;
}
function Su(e, t, n) {
	var r = e.getElementsByClassName(t);
	return n < 0 ? n = r.length + n : n >= r.length && (n = r.length - 1), n < 0 ? null : r[n];
}
function Cu(e, t, n, r, i = 1) {
	var a = Z(e, r);
	if (a == null) return null;
	for (var o = Y(a, r, void 0, i); o != null;) {
		var s = ku(o, t, n);
		if (s != null) return s;
		o = Y(o, r, void 0, i);
	}
	return null;
}
function wu(e, t, n, r, i = 1) {
	var a = Z(e, r);
	return a == null ? null : ku(a, t, n, i);
}
function Tu(e) {
	return e != null && e != null && e.nodeType === Node.ELEMENT_NODE;
}
function Eu(e) {
	return Tu(e) && e instanceof HTMLElement;
}
function X(e, t) {
	if (!e) return !1;
	let n = e.tagName.toUpperCase();
	if (typeof t == "string") return n == t.toUpperCase();
	let r = t;
	for (let e = 0; e < r.length; e++) if (n == r[e].toUpperCase()) return !0;
	return !1;
}
function Z(e, t) {
	if (t == null || t == null) return null;
	for (; e !== null && !X(e, "body");) {
		if (q(e, t)) return e;
		if (e.parentNode === document) return null;
		e = e.parentNode;
	}
	return null;
}
function Du(e, t) {
	for (; e !== null && !X(e, "body");) {
		if (e === t) return !0;
		if (e.parentNode === document) return null;
		e = e.parentNode;
	}
	return !1;
}
function Ou(e, t) {
	if (t == null || t == null) return null;
	for (t = t.toUpperCase(); e !== null;) {
		let n = e.tagName.toUpperCase();
		if (n === t) return e;
		if (n === "BODY") break;
		if (e.parentNode === document) return null;
		e = e.parentNode;
	}
	return null;
}
function ku(e, t, n = void 0, r = 1) {
	var i = e.getElementsByClassName(t);
	for (let e = r == 1 ? 0 : i.length - 1; e >= 0 && e < i.length; e += r) if (!(n !== null && q(i[e], n))) return i[e];
	return null;
}
function Au(e, t, n) {
	var r = e.getElementsByClassName(t);
	return n >= 0 ? n < r.length ? r[n] : null : (n = r.length + n, n >= 0 ? r[n] : null);
}
function ju(e, t, n) {
	var r = e.getElementsByClassName(n);
	for (let e = 0; e < r.length; e++) if (r[e] == t) return e;
	return -1;
}
function Q(e, t, n, r) {
	if (!e) return null;
	let i = au(e, (e) => e.getAttribute(t) !== null && Ee(e.getAttribute(t), !1) !== ""), a = i ? i.getAttribute(t) : null;
	return a = a === null ? n || null : Ee(a, !1), a === null || r === void 0 ? a : r + a;
}
function Mu(e, t) {
	if (!e) return null;
	let n = au(e, (e) => e.getAttribute(t) !== null), r = n ? n.getAttribute(t) : null;
	return r === null ? null : De(r);
}
function Nu(e, t) {
	let n = [];
	for (let r = 0; r < e.childNodes.length; r++) {
		let i = e.childNodes[r];
		if (i.nodeType == Node.ELEMENT_NODE) {
			let e = i;
			if (e.getAttribute(t)) n.push(e);
			else {
				let r = Nu(e, t);
				for (let e = 0; e < r.length; e++) n.push(r[e]);
			}
		}
	}
	return n;
}
function $(e, t) {
	if (e !== null) {
		if (e.focus(), X(e, "input") || X(e, "textarea")) {
			let n = e;
			n.type !== "number" && (t === void 0 ? n.setSelectionRange(0, n.value.length) : n.setSelectionRange(t, t));
		}
		return Ru(e) && xs(e) && _s(e), !0;
	}
	return !1;
}
function Pu(e, t = "data-extract-order") {
	let n = {}, r = [], i = [];
	for (let a = 0; a < e.length; a++) {
		let o = e[a], s = Q(o, t);
		s ? (s in n || (r.push(s), n[s] = []), n[s].push(o)) : i.push(o);
	}
	r.sort((e, t) => Fu(e) < Fu(t) ? -1 : 1);
	for (let e = 0; e < r.length; e++) {
		let t = n["" + r[e]];
		for (let e = 0; e < t.length; e++) i.push(t[e]);
	}
	return i;
}
function Fu(e) {
	let t = parseInt(e);
	return isNaN(t) ? e.charCodeAt(0) : t;
}
function Iu(e, t, n) {
	let r = [], i = null;
	t && (i = document.getElementById(t), i && r.push(i)), n && q(n, e) && r.push(n);
	let a = n ? n.getElementsByClassName(e) : document.getElementsByClassName(e);
	for (let e = 0; e < a.length; e++) {
		let t = a[e];
		t != i && r.push(t);
	}
	return r;
}
function Lu(e) {
	return e ? X(e, "input") || X(e, "textarea") : !1;
}
function Ru(e) {
	return e ? Lu(e) || X(e, "select") || X(e, "button") : !1;
}
function zu(e) {
	let t = getComputedStyle(e).transform;
	return t == "none" ? new DOMMatrix() : new DOMMatrix(t);
}
function Bu(e, t) {
	let n = [], r = e;
	for (; Tu(r) && !X(r, "body");) n.push(r), r = r.parentNode;
	let i = t;
	for (; Tu(i) && !X(i, "body");) {
		if (n.indexOf(i) >= 0) return i;
		i = i.parentNode;
	}
	return console.error("No common ancestor found! Are these elements in the same document?"), null;
}
function Vu(e) {
	let t = e.parentNode;
	for (let n = 0; n < t.childNodes.length; n++) if (t?.childNodes[n] == e) return n;
	throw Error(`Cannot find ${e} order within ${t}`);
}
function Hu(e, t) {
	let n = e.parentNode;
	if (n?.removeChild(e), t == -1 || t >= n.childNodes.length) {
		n?.appendChild(e);
		return;
	}
	let r = n.childNodes[t];
	n?.insertBefore(e, r);
}
//#endregion
//#region src/validateSudoku.ts
function Uu(e) {
	return {
		columns: [],
		rows: [],
		squares: []
	};
}
//#endregion
export { fe as CodeError, g as ContextError, Ur as EdgeTypes, Vt as EventSyncActivity, je as FormulaNode, La as PuzzleStatus, Pu as SortElements, tu as TrimMode, Gi as TryParseJson, Zc as _rawHtmlSource, wl as addLink, Ao as afterInputUpdate, or as appendFromTemplate, cu as appendRange, J as applyAllClasses, ys as arrowFromInputGroup, hs as autoCompleteWord, kt as backlinkFromUrl, Un as builtInTemplate, Ya as cacheLogin, Wi as checkLocalStorage, Su as childAtIndex, bu as clearAllClasses, Ci as clearAllStraightEdges, Hs as clicksFindInputs, Ce as cloneAttributes, we as cloneSomeAttributes, Ee as cloneText, Te as cloneTextNode, De as complexAttribute, gu as consoleComment, hu as consoleTrace, lc as constructSvgImageCell, uc as constructSvgStampable, cc as constructSvgTextCell, ac as constructTable, $n as copyto_final_answer, Si as createFromVertexList, Nt as createRatingUI, pe as debugTagAttrs, Pn as decodeAndValidate, Oc as diffSummarys, Rr as distance2, Lr as distance2Mouse, Or as doStamp, v as elementSourceOffset, y as elementSourceOffseter, jt as enableValidation, b as evaluateAttribute, Le as evaluateFormula, lu as expandContents, su as expandControlTags, Go as extractWordIndex, wu as findEndInContainer, ku as findFirstChildOfClass, pa as findGlobalIndex, Cu as findInNextContainer, Y as findNextOfClass, Au as findNthChildOfClass, Z as findParentOfClass, Ou as findParentOfTag, cl as forceReload, qa as forgetChildrenOf, Jc as getAccumulatedTransformMatrix, yu as getAllClasses, Nu as getAllElementsWithAttribute, _e as getBuilderContext, iu as getBuilderParentIf, Vu as getChildOrder, Ga as getCurFileName, Tr as getCurrentStampToolId, Iu as getElementsByClassOrId, I as getGlobalIndex, ks as getLetterStyles, Ja as getLogin, Mu as getOptionalComplex, Q as getOptionalStyle, au as getParentIf, za as getPuzzleStatus, w as getSafariDetails, Er as getStampParent, Vr as getStraightEdgeType, Vn as getTemplate, nu as getTrimMode, Es as getValueFromTextContainer, Kl as hasBuilderElements, q as hasClass, xs as hasInputGroup, ou as inSvgNamespace, _a as indexAllCheckFields, va as indexAllDragDropFields, ya as indexAllDrawableFields, ba as indexAllHighlightableFields, ha as indexAllInputFields, ga as indexAllNoteFields, xa as indexAllVertices, xu as indexInContainer, Xl as initElementStack, o as initFreeDropZorder, Ot as initSafariDetails, zl as inputAreaTagNames, Ru as isArrowKeyElement, nl as isBodyDebug, le as isContextError, el as isDebug, Tu as isElement, Eu as isHTMLElement, rl as isIFrame, al as isIcon, ol as isModal, il as isPrint, sl as isRestart, Du as isSelfOrParent, X as isTag, Lu as isTextInputElement, tl as isTrace, St as keyExistsInContext, U as linkCss, Ba as listPuzzlesOfStatus, Ua as loadMetaMaterials, Wa as loadMetaPiece, Mt as lookupSafari, x as makeFloat, Be as makeInt, Ve as makeString, ma as mapGlobalIndeces, zu as matrixFromElement, Hu as moveChildOrder, $ as moveFocus, Bu as mutualAncestor, ic as newTR, de as nodeSourceOffset, du as normalizeName, bo as onButtonKeyDown, vo as onInputEvent, qo as onLetterChange, Oo as onLetterInput, ko as onLetterKey, yo as onLetterKeyDown, To as onLetterKeyUp, Jo as onWordChange, Ho as onWordInput, Uo as onWordKey, Zt as pingEventServer, be as popBuilderContext, eu as popBuilderElement, Ir as positionFromCenter, e as positionFromStyle, n as postprocessDragFunctions, t as preprocessDragFunctions, zr as preprocessRulerFunctions, dr as preprocessStampObjects, Nc as preprocessSvgDragFunctions, ye as pushBuilderContext, $l as pushBuilderElement, G as pushRange, ce as quickFreeMove, se as quickMove, ar as refillFromTemplate, an as refreshTeamHomePage, Dt as registerEvent, _u as removeClassGlobally, kc as renderDiffs, Va as resetAllPuzzleStatus, Ha as resetPuzzleProgress, ra as saveCheckLocally, ia as saveContainerLocally, la as saveGuessHistory, sa as saveHighlightLocally, ea as saveLetterLocally, na as saveNoteLocally, aa as savePositionLocally, ua as saveScratches, oa as saveStampingLocally, da as saveStates, ca as saveStraightEdge, ta as saveWordLocally, gn as scanMetaMaterials, Ii as scratchClear, Li as scratchCreate, mn as sendFeedback, pn as sendRating, _s as setCurrentInputGroup, ao as setupCrossOffs, tc as setupDecoderToggle, Xt as setupEventSync, so as setupHighlights, hn as setupMetaSync, Xa as setupNotes, Ti as setupScratch, dc as setupSubways, wn as setupValidation, ru as shouldThrow, rc as showDecoder, Pt as showRatingUI, ju as siblingIndexOfClass, pu as splitEmoji, Ml as startForLoop, Rl as startIfBlock, Ul as startInputArea, Ui as storageKey, Tc as summarizePageLayout, oc as svg_xmlns, fn as syncUnlockedFile, jl as testBoilerplate, ve as testBuilderContext, Ct as textFromContext, Pi as textFromScratchDiv, Ds as textSetup, W as theBoiler, he as theBoilerContext, Bn as theValidation, K as toggleClass, nc as toggleDecoder, co as toggleHighlight, io as toggleNotes, ke as tokenizeFormula, xt as tokenizeText, me as traceTagComment, Qt as trackPuzzleProgress, Ie as treeifyFormula, Ra as updatePuzzleList, Wo as updateWordExtraction, $c as urlArgExists, dn as urlSansArgs, er as useTemplate, An as validateInputReady, Uu as validateSudoku, xe as valueFromContext, Se as valueFromGlobalContext, _ as wrapContextError };
typeof globalThis < "u" && Object.assign(globalThis, PuzzylKit);

//# sourceMappingURL=kit.es.js.map