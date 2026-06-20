import { CSSProperties } from "react";

export const formStyles: { [key: string]: CSSProperties } = {
  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "20px",
  },

  row3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "20px",
    marginBottom: "20px",
  },

  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  label: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#344054",
    textTransform: "uppercase",
  },

  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #d0d5dd",
    fontSize: "14px",
  },

  textarea: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #d0d5dd",
    fontSize: "14px",
    minHeight: "120px",
  },
};