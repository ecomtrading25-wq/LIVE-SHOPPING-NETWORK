import axios from "axios";
import { db } from "../_core/db";
import { shippingProviderAccounts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

interface USPSRateRequest {
  originZip: string;
  destinationZip: string;
  weight: number; // in ounces
  length: number;
  width: number;
  height: number;
  service?: "PRIORITY" | "EXPRESS" | "FIRST_CLASS" | "PARCEL_SELECT";
}

interface USPSRateResponse {
  service: string;
  rate: number;
  deliveryDays: number;
  carrier: "USPS";
}

interface USPSLabelRequest {
  orderId: string;
  fromAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  toAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  weight: number;
  length: number;
  width: number;
  height: number;
  service: string;
}

interface USPSLabelResponse {
  trackingNumber: string;
  labelUrl: string;
  cost: number;
}

export class USPSCarrier {
  private apiKey: string;
  private apiUrl: string;
  private userId: string;

  constructor(apiKey: string, userId: string) {
    this.apiKey = apiKey;
    this.userId = userId;
    this.apiUrl = "https://secure.shippingapis.com/ShippingAPI.dll";
  }

  /**
   * Get shipping rates from USPS
   */
  async getRates(request: USPSRateRequest): Promise<USPSRateResponse[]> {
    const xml = `
      <RateV4Request USERID="${this.userId}">
        <Revision>2</Revision>
        <Package ID="1ST">
          <Service>${request.service || "PRIORITY"}</Service>
          <ZipOrigination>${request.originZip}</ZipOrigination>
          <ZipDestination>${request.destinationZip}</ZipDestination>
          <Pounds>${Math.floor(request.weight / 16)}</Pounds>
          <Ounces>${request.weight % 16}</Ounces>
          <Container>VARIABLE</Container>
          <Width>${request.width}</Width>
          <Length>${request.length}</Length>
          <Height>${request.height}</Height>
          <Girth>${2 * (request.width + request.height)}</Girth>
          <Machinable>true</Machinable>
        </Package>
      </RateV4Request>
    `;

    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          API: "RateV4",
          XML: xml,
        },
      });

      // Parse XML response (simplified - in production use xml2js)
      const rates: USPSRateResponse[] = [];
      
      // Priority Mail
      rates.push({
        service: "USPS Priority Mail",
        rate: this.extractRate(response.data, "Priority"),
        deliveryDays: 2,
        carrier: "USPS",
      });

      // Priority Mail Express
      rates.push({
        service: "USPS Priority Mail Express",
        rate: this.extractRate(response.data, "Express"),
        deliveryDays: 1,
        carrier: "USPS",
      });

      // First Class
      if (request.weight <= 13) {
        rates.push({
          service: "USPS First Class",
          rate: this.extractRate(response.data, "First"),
          deliveryDays: 3,
          carrier: "USPS",
        });
      }

      return rates.filter((r) => r.rate > 0);
    } catch (error) {
      console.error("USPS rate error:", error);
      throw new Error("Failed to get USPS rates");
    }
  }

  /**
   * Create shipping label
   */
  async createLabel(request: USPSLabelRequest): Promise<USPSLabelResponse> {
    const xml = `
      <eVSRequest USERID="${this.userId}">
        <Option></Option>
        <Revision>2</Revision>
        <ImageParameters>
          <ImageParameter>4X6LABEL</ImageParameter>
        </ImageParameters>
        <FromName>${request.fromAddress.name}</FromName>
        <FromFirm></FromFirm>
        <FromAddress1></FromAddress1>
        <FromAddress2>${request.fromAddress.street}</FromAddress2>
        <FromCity>${request.fromAddress.city}</FromCity>
        <FromState>${request.fromAddress.state}</FromState>
        <FromZip5>${request.fromAddress.zip}</FromZip5>
        <FromZip4></FromZip4>
        <ToName>${request.toAddress.name}</ToName>
        <ToFirm></ToFirm>
        <ToAddress1></ToAddress1>
        <ToAddress2>${request.toAddress.street}</ToAddress2>
        <ToCity>${request.toAddress.city}</ToCity>
        <ToState>${request.toAddress.state}</ToState>
        <ToZip5>${request.toAddress.zip}</ToZip5>
        <ToZip4></ToZip4>
        <WeightInOunces>${request.weight}</WeightInOunces>
        <ServiceType>${this.mapServiceType(request.service)}</ServiceType>
        <Width>${request.width}</Width>
        <Length>${request.length}</Length>
        <Height>${request.height}</Height>
        <Girth>${2 * (request.width + request.height)}</Girth>
        <Machinable>true</Machinable>
      </eVSRequest>
    `;

    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          API: "eVS",
          XML: xml,
        },
      });

      // Parse XML response
      const trackingNumber = this.extractTrackingNumber(response.data);
      const labelUrl = this.extractLabelUrl(response.data);
      const cost = this.extractPostage(response.data);

      return {
        trackingNumber,
        labelUrl,
        cost,
      };
    } catch (error) {
      console.error("USPS label creation error:", error);
      throw new Error("Failed to create USPS label");
    }
  }

  /**
   * Track shipment
   */
  async trackShipment(trackingNumber: string): Promise<any> {
    const xml = `
      <TrackFieldRequest USERID="${this.userId}">
        <Revision>1</Revision>
        <ClientIp>127.0.0.1</ClientIp>
        <SourceId>LiveShoppingNetwork</SourceId>
        <TrackID ID="${trackingNumber}"></TrackID>
      </TrackFieldRequest>
    `;

    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          API: "TrackV2",
          XML: xml,
        },
      });

      return this.parseTrackingResponse(response.data);
    } catch (error) {
      console.error("USPS tracking error:", error);
      throw new Error("Failed to track USPS shipment");
    }
  }

  /**
   * Validate address
   */
  async validateAddress(address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }): Promise<any> {
    const xml = `
      <AddressValidateRequest USERID="${this.userId}">
        <Revision>1</Revision>
        <Address ID="0">
          <Address1></Address1>
          <Address2>${address.street}</Address2>
          <City>${address.city}</City>
          <State>${address.state}</State>
          <Zip5>${address.zip}</Zip5>
          <Zip4></Zip4>
        </Address>
      </AddressValidateRequest>
    `;

    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          API: "Verify",
          XML: xml,
        },
      });

      return this.parseAddressValidationResponse(response.data);
    } catch (error) {
      console.error("USPS address validation error:", error);
      throw new Error("Failed to validate address");
    }
  }

  // Helper methods
  private extractRate(xml: string, service: string): number {
    const regex = new RegExp(`<Postage>${service}.*?<Rate>(\\d+\\.\\d+)</Rate>`, "i");
    const match = xml.match(regex);
    return match ? parseFloat(match[1]) : 0;
  }

  private extractTrackingNumber(xml: string): string {
    const match = xml.match(/<BarcodeNumber>(.*?)<\/BarcodeNumber>/);
    return match ? match[1] : "";
  }

  private extractLabelUrl(xml: string): string {
    const match = xml.match(/<LabelImage>(.*?)<\/LabelImage>/);
    return match ? `data:image/png;base64,${match[1]}` : "";
  }

  private extractPostage(xml: string): number {
    const match = xml.match(/<Postage>(.*?)<\/Postage>/);
    return match ? parseFloat(match[1]) : 0;
  }

  private mapServiceType(service: string): string {
    const mapping: Record<string, string> = {
      "USPS Priority Mail": "Priority",
      "USPS Priority Mail Express": "Express",
      "USPS First Class": "First",
      "USPS Parcel Select": "ParcelSelect",
    };
    return mapping[service] || "Priority";
  }

  private parseTrackingResponse(xml: string): any {
    // Simplified parsing - in production use xml2js
    return {
      status: this.extractXmlTag(xml, "Status"),
      statusDetail: this.extractXmlTag(xml, "StatusSummary"),
      location: this.extractXmlTag(xml, "EventCity"),
      timestamp: this.extractXmlTag(xml, "EventDate"),
      delivered: xml.includes("Delivered"),
    };
  }

  private parseAddressValidationResponse(xml: string): any {
    return {
      street: this.extractXmlTag(xml, "Address2"),
      city: this.extractXmlTag(xml, "City"),
      state: this.extractXmlTag(xml, "State"),
      zip: this.extractXmlTag(xml, "Zip5"),
      valid: !xml.includes("<Error>"),
    };
  }

  private extractXmlTag(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`, "i");
    const match = xml.match(regex);
    return match ? match[1] : "";
  }
}

/**
 * Get USPS carrier instance for a channel
 */
export async function getUSPSCarrier(channelId: string): Promise<USPSCarrier> {
  const account = await db
    .select()
    .from(shippingProviderAccounts)
    .where(eq(shippingProviderAccounts.channelId, channelId))
    .limit(1);

  if (!account[0]) {
    throw new Error("USPS account not configured");
  }

  const credentials = JSON.parse(account[0].credentials);
  return new USPSCarrier(credentials.apiKey, credentials.userId);
}
