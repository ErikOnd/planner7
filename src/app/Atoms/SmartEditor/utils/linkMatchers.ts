import { createLinkMatcherWithRegExp } from "@lexical/react/LexicalAutoLinkPlugin";

const URL_REGEX = /(https?:\/\/(?:www\.)?[^\s/$.?#].[^\s]*)/i;
const EMAIL_REGEX = /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)@(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

export const LINK_MATCHERS = [
	createLinkMatcherWithRegExp(URL_REGEX, (text) => text),
	createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => `mailto:${text}`),
];
