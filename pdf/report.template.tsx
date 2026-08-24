/** @jsxRuntime classic */
/** @jsx React.createElement */
import * as React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

export interface ReportPdfProps {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
  logo?: string;
  generatedAt?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
    color: "#111827",
    flexDirection: "column",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#B03060",
    paddingBottom: 10,
    marginBottom: 15,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#90274F",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 2,
  },
  meta: {
    fontSize: 8,
    color: "#6B7280",
    marginTop: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F5DBE5",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    color: "#701F3D",
    fontSize: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableCell: {
    fontSize: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    color: "#111827",
  },
  footer: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 6,
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 2,
  },
});

export default function ReportTemplate({
  title,
  subtitle,
  headers,
  rows,
  logo,
  generatedAt,
}: ReportPdfProps) {
  const colWidths = headers.map((header) => {
    const len = header.length;
    if (len <= 6) return "10%";
    if (len <= 10) return "14%";
    if (len <= 18) return "18%";
    return "22%";
  });

  const now = generatedAt || new Date().toISOString().split("T")[0];

  return (
    <Document title={title}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          {logo ? <Image src={logo} style={styles.logo} /> : null}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>ABAARSO TECH UNIVERSITY</Text>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            <Text style={styles.meta}>Generated: {now}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            {headers.map((header, index) => (
              <Text key={header} style={[styles.tableHeaderCell, { width: colWidths[index] }]}>
                {header}
              </Text>
            ))}
          </View>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.tableRow}>
              {row.map((cell, cellIndex) => (
                <Text key={cellIndex} style={[styles.tableCell, { width: colWidths[cellIndex] }]}>
                  {cell == null ? "" : String(cell)}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This report is generated electronically by the Abaarso Tech University Result Management System.
          </Text>
          <Text style={styles.footerText}>Generated: {now}</Text>
        </View>
      </Page>
    </Document>
  );
}
