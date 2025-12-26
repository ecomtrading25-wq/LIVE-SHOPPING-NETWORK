import axios from "axios";

interface UPSRateRequest {
  originZip: string;
  destinationZip: string;
  weight: number;
  length: number;
  width: number;
  height: number;
}

interface UPSRateResponse {
  service: string;
  rate: number;
  deliveryDays: number;
  carrier: "UPS";
}

export class UPSCarrier {
  private apiKey: string;
  private apiUrl: string;
  private accountNumber: string;

  constructor(apiKey: string, accountNumber: string) {
    this.apiKey = apiKey;
    this.accountNumber = accountNumber;
    this.apiUrl = "https://onlinetools.ups.com/api";
  }

  async getRates(request: UPSRateRequest): Promise<UPSRateResponse[]> {
    const payload = {
      RateRequest: {
        Request: {
          TransactionReference: {
            CustomerContext: "Rating",
          },
        },
        Shipment: {
          ShipFrom: {
            Address: {
              PostalCode: request.originZip,
              CountryCode: "US",
            },
          },
          ShipTo: {
            Address: {
              PostalCode: request.destinationZip,
              CountryCode: "US",
            },
          },
          Package: {
            PackagingType: {
              Code: "02", // Customer Supplied Package
            },
            Dimensions: {
              UnitOfMeasurement: {
                Code: "IN",
              },
              Length: request.length.toString(),
              Width: request.width.toString(),
              Height: request.height.toString(),
            },
            PackageWeight: {
              UnitOfMeasurement: {
                Code: "LBS",
              },
              Weight: (request.weight / 16).toString(),
            },
          },
        },
      },
    };

    try {
      const response = await axios.post(`${this.apiUrl}/rating/v1/Rate`, payload, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      const rates: UPSRateResponse[] = [];
      const services = response.data.RateResponse.RatedShipment || [];

      for (const service of services) {
        rates.push({
          service: `UPS ${this.mapServiceName(service.Service.Code)}`,
          rate: parseFloat(service.TotalCharges.MonetaryValue),
          deliveryDays: parseInt(service.GuaranteedDelivery?.BusinessDaysInTransit || "3"),
          carrier: "UPS",
        });
      }

      return rates;
    } catch (error) {
      console.error("UPS rate error:", error);
      return [];
    }
  }

  async createLabel(request: any): Promise<any> {
    // UPS label creation implementation
    const payload = {
      ShipmentRequest: {
        Shipment: {
          ShipFrom: request.fromAddress,
          ShipTo: request.toAddress,
          Package: {
            Packaging: { Code: "02" },
            Dimensions: {
              Length: request.length,
              Width: request.width,
              Height: request.height,
            },
            PackageWeight: {
              Weight: (request.weight / 16).toString(),
            },
          },
          Service: {
            Code: this.mapServiceCode(request.service),
          },
        },
        LabelSpecification: {
          LabelImageFormat: { Code: "PDF" },
        },
      },
    };

    try {
      const response = await axios.post(`${this.apiUrl}/shipments/v1/ship`, payload, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return {
        trackingNumber: response.data.ShipmentResponse.ShipmentResults.PackageResults.TrackingNumber,
        labelUrl: response.data.ShipmentResponse.ShipmentResults.PackageResults.ShippingLabel.GraphicImage,
        cost: parseFloat(response.data.ShipmentResponse.ShipmentResults.ShipmentCharges.TotalCharges.MonetaryValue),
      };
    } catch (error) {
      console.error("UPS label creation error:", error);
      throw new Error("Failed to create UPS label");
    }
  }

  async trackShipment(trackingNumber: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/track/v1/details/${trackingNumber}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      const activity = response.data.trackResponse.shipment[0].package[0].activity[0];
      return {
        status: activity.status.description,
        location: activity.location.address.city,
        timestamp: activity.date + " " + activity.time,
        delivered: activity.status.type === "D",
      };
    } catch (error) {
      console.error("UPS tracking error:", error);
      throw new Error("Failed to track UPS shipment");
    }
  }

  private mapServiceName(code: string): string {
    const mapping: Record<string, string> = {
      "01": "Next Day Air",
      "02": "2nd Day Air",
      "03": "Ground",
      "12": "3 Day Select",
      "13": "Next Day Air Saver",
      "14": "Next Day Air Early",
      "59": "2nd Day Air A.M.",
    };
    return mapping[code] || "Ground";
  }

  private mapServiceCode(service: string): string {
    const mapping: Record<string, string> = {
      "UPS Ground": "03",
      "UPS Next Day Air": "01",
      "UPS 2nd Day Air": "02",
      "UPS 3 Day Select": "12",
    };
    return mapping[service] || "03";
  }
}
