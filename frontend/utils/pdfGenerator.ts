import * as Print from 'expo-print';
import { JobCard, StitchingWorkOrder } from '../types';
import { format } from 'date-fns';

export const generateJobCardPDF = async (jobCard: JobCard): Promise<string> => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }
          th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .header {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .section-title {
            background-color: #e0e0e0;
            font-weight: bold;
            padding: 8px;
            margin-top: 10px;
          }
          .row {
            display: flex;
            margin-bottom: 5px;
          }
          .col-50 {
            width: 50%;
            padding: 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">Job Card</div>
        
        <table>
          <tr>
            <th>PO Number</th>
            <td>${jobCard.poNumber}</td>
            <th>Job Card No.</th>
            <td>${jobCard.jobCardNumber}</td>
          </tr>
          <tr>
            <th>Customer Name</th>
            <td>${jobCard.customerName}</td>
            <th>Issued On</th>
            <td>${format(jobCard.issuedOn, 'dd-MMM-yyyy')}</td>
          </tr>
          <tr>
            <th colspan="2">Delivery</th>
            <td colspan="2">${format(jobCard.delivery, 'dd-MMM-yyyy')}</td>
          </tr>
        </table>

        <div class="section-title">Raw Material Specification</div>
        <table>
          <tr>
            <th>Fabric Code</th>
            <td>${jobCard.fabricCode}</td>
            <th>Fabric Design</th>
            <td>${jobCard.fabricDesign}</td>
            <th>Fabric Width</th>
            <td>${jobCard.fabricWidth}</td>
          </tr>
        </table>

        <div class="section-title">Job Order Specification</div>
        <table>
          <tr>
            <th>Sl. No.</th>
            <th>Drop</th>
            <th>Ready</th>
            <th>Width</th>
            <th>1 Set Pieces</th>
            <th>Meters</th>
            <th>Notes</th>
          </tr>
          ${jobCard.specifications.map(spec => `
            <tr>
              <td>${spec.slNo}</td>
              <td>${spec.drop}</td>
              <td>${spec.ready}</td>
              <td>${spec.width}</td>
              <td>${spec.setPieces}</td>
              <td>${spec.meters}</td>
              <td>${spec.notes}</td>
            </tr>
          `).join('')}
          <tr>
            <th colspan="7">TOTAL</th>
          </tr>
        </table>

        <table>
          <tr>
            <th>No. of Sets</th>
            <td>${jobCard.totalSets}</td>
            <th>Hanging Mechanism</th>
            <td>${jobCard.hangingMechanism}</td>
          </tr>
          <tr>
            <th>Side Fold</th>
            <td>${jobCard.sideFold}</td>
            <th>Velcro Quantity</th>
            <td>${jobCard.velcroQuantity}</td>
          </tr>
          <tr>
            <th>Velcro Colour</th>
            <td>${jobCard.velcroColour}</td>
            <th>Other Specs</th>
            <td>${jobCard.otherSpecs}</td>
          </tr>
          <tr>
            <th colspan="2">Other Comments</th>
            <td colspan="2">${jobCard.otherComments}</td>
          </tr>
          <tr>
            <th>Completed On</th>
            <td>${jobCard.completedOn ? format(jobCard.completedOn, 'dd-MMM-yyyy') : '_______'}</td>
            <th>Approved By</th>
            <td>${jobCard.approvedBy}</td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
};

export const generateStitchingWorkOrderPDF = async (order: StitchingWorkOrder): Promise<string> => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }
          th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .header {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .section-title {
            background-color: #e0e0e0;
            font-weight: bold;
            padding: 8px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">Stitching Work Order</div>
        
        <table>
          <tr>
            <th>Work Order No.</th>
            <td>${order.workOrderNumber}</td>
            <th>Issued On</th>
            <td>${format(order.issuedOn, 'dd-MMM-yyyy')}</td>
          </tr>
          <tr>
            <th>Issued To</th>
            <td>${order.issuedTo}</td>
            <th>Reference Job</th>
            <td>${order.referenceJobCardNumber}</td>
          </tr>
          <tr>
            <th colspan="2">Fabric Colour</th>
            <td colspan="2">${order.fabricColour}</td>
          </tr>
        </table>

        <div class="section-title">Stitching Specifications</div>
        <table>
          <tr>
            <th>Sl. No.</th>
            <th>Drop</th>
            <th>Ready</th>
            <th>Width</th>
            <th>Pieces</th>
            <th>Receipt</th>
            <th>Stitching Specification</th>
          </tr>
          ${order.specifications.map(spec => `
            <tr>
              <td>${spec.slNo}</td>
              <td>${spec.drop}</td>
              <td>${spec.ready}</td>
              <td>${spec.width}</td>
              <td>${spec.pieces}</td>
              <td>${spec.receipt}</td>
              <td>${spec.stitchingSpecification}</td>
            </tr>
          `).join('')}
        </table>

        <table>
          <tr>
            <th>Other Comments</th>
            <td colspan="3">${order.otherComments}</td>
          </tr>
          <tr>
            <th>Completed On</th>
            <td>${order.completedOn ? format(order.completedOn, 'dd-MMM-yyyy') : '_______'}</td>
            <th>Total</th>
            <td>${order.total}</td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
};

export const generateDyeingOrderPDF = async (order: any): Promise<string> => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #000;
            padding: 10px;
            text-align: left;
          }
          th {
            background-color: #e0e0e0;
            font-weight: bold;
          }
          .header {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">Dyeing House Order</div>
        
        <table>
          <tr>
            <th>Order Number</th>
            <td>${order.orderNumber}</td>
          </tr>
          <tr>
            <th>Date</th>
            <td>${format(order.date, 'dd-MMM-yyyy')}</td>
          </tr>
          <tr>
            <th>Fabric Code</th>
            <td>${order.fabricCode}</td>
          </tr>
          <tr>
            <th>Fabric Type</th>
            <td>${order.fabricType}</td>
          </tr>
          <tr>
            <th>Width</th>
            <td>${order.width}</td>
          </tr>
          <tr>
            <th>Quantity</th>
            <td>${order.quantity}</td>
          </tr>
          <tr>
            <th>Color</th>
            <td>${order.color}</td>
          </tr>
          <tr>
            <th>Dyeing House</th>
            <td>${order.dyeingHouse}</td>
          </tr>
          <tr>
            <th>Location</th>
            <td>${order.location}</td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
};
