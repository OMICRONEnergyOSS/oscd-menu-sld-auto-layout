import { identity } from '@openscd/scl-lib';

export const privType = 'OpenSCD-SLD-Layout';
export const sldNs = 'https://openscd.org/SCL/SSD/SLD/v0';
export const xmlnsNs = 'http://www.w3.org/2000/xmlns/';

function isIedReferenceElement(element: Element): boolean {
  return (
    element.localName === 'Reference' &&
    element.namespaceURI === sldNs &&
    element.getAttributeNS(sldNs, 'type') === 'IED'
  );
}

export function iedReferences(root: XMLDocument | Element): Element[] {
  return Array.from(root.getElementsByTagNameNS(sldNs, 'Reference')).filter(
    isIedReferenceElement
  );
}

export function resolveIed(reference: Element): Element | null {
  if (!isIedReferenceElement(reference)) return null;

  const referenceIdentity = reference.getAttributeNS(sldNs, 'id');
  if (!referenceIdentity) return null;

  return (
    Array.from(reference.ownerDocument.querySelectorAll(':root > IED')).find(
      ied => identity(ied) === referenceIdentity
    ) ?? null
  );
}

function sldAttributes(element: Element): Element | null {
  if (isIedReferenceElement(element))
    return element.querySelector(':scope > SLDAttributes');

  return (
    element.querySelector(`:scope > Private[type="${privType}"] > SLDAttributes`) ??
    null
  );
}

export function getSLDAttributes(element: Element, key: string): string | null {
  return sldAttributes(element)?.getAttributeNS(sldNs, key) ?? null;
}