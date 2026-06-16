import { LightningElement, api } from "lwc";

/** @typedef {import("coveo").SpotlightContent} SpotlightContent */
/** @typedef {import("coveo").InteractiveSpotlightContent} InteractiveSpotlightContent */

export default class CommerceSpotlightContent extends LightningElement {
  /**
   * The spotlight content item.
   * @api
   * @type {SpotlightContent}
   */
  @api result;
  /**
   * The interactive spotlight content controller
   * @api
   * @type {InteractiveSpotlightContent}
   */
  @api interactiveSpotlightContent;

  get hrefValue() {
    return this.result?.clickUri;
  }

  get name() {
    return this.result?.name || "";
  }

  get nameColor() {
    return `color:${this.result?.nameFontColor || "inherit"};`;
  }

  get description() {
    return this.result?.description || "";
  }

  get descriptionColor() {
    return `color:${this.result?.descriptionFontColor || "inherit"};`;
  }

  get backgroundImage() {
    return `background-image:url(${this.result?.desktopImage || ""});`;
  }

  get altText() {
    return this.result?.altText || "";
  }

  handleClick() {
    if (!this.result) {
      return;
    }
    // Destructuring transforms the Proxy object created by Salesforce to a normal object
    // so no unexpected behaviour will occur with the Headless library.
    // @ts-ignore
    const result = {
      ...(this.result || {})
    };
    // interactiveSpotlightContent is a factory function that creates the interactive spotlight content controller.
    // @ts-ignore
    this.interactiveSpotlightContent?.({
      options: { spotlightContent: result }
    })?.select();
  }
}
