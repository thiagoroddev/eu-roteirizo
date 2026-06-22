import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FileUploader } from "../../components/FileUploader";
import { UI_LABELS } from "../../constants/uiLabels";

describe("FileUploader", () => {
  const mockOnFileUpload = () => {};

  it("renderiza o botão de upload usando UI_LABELS", () => {
    render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} hasRoutes={false} error={null} />);

    expect(screen.getByText(UI_LABELS.FILE_UPLOADER.UPLOAD)).toBeInTheDocument();
  });

  it("renderiza 'Processando...' quando loading é true usando UI_LABELS", () => {
    render(<FileUploader onFileUpload={mockOnFileUpload} loading={true} hasRoutes={false} error={null} />);

    expect(screen.getByText(UI_LABELS.FILE_UPLOADER.PROCESSING)).toBeInTheDocument();
  });

  it("renderiza instrução de seleção de arquivo usando UI_LABELS", () => {
    render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} hasRoutes={false} error={null} />);

    expect(screen.getByText(UI_LABELS.FILE_UPLOADER.SELECT_FILE)).toBeInTheDocument();
  });

  it("renderiza título de instruções usando UI_LABELS", () => {
    render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} hasRoutes={false} error={null} />);

    expect(screen.getByText(UI_LABELS.FILE_UPLOADER.INSTRUCTIONS)).toBeInTheDocument();
  });

  it("renderiza 'Carregando...' quando loading é true usando UI_LABELS", () => {
    render(<FileUploader onFileUpload={mockOnFileUpload} loading={true} hasRoutes={false} error={null} />);

    expect(screen.getByText(UI_LABELS.FILE_UPLOADER.LOADING)).toBeInTheDocument();
  });

  it("renderiza mensagem de erro quando error não é null", () => {
    const errorMessage = "Erro de teste";
    render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} hasRoutes={false} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("renderiza aviso de colunas faltantes usando UI_LABELS", () => {
    const missingCols = ["Coluna1", "Coluna2"];
    render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} hasRoutes={false} error={null} missingCols={missingCols} />);

    expect(screen.getByText(UI_LABELS.FILE_UPLOADER.INCOMPLETE_SHEET)).toBeInTheDocument();
    expect(screen.getByText(/Coluna1, Coluna2/)).toBeInTheDocument();
  });

  it("não renderiza instruções quando hasRoutes é true", () => {
    render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} hasRoutes={true} error={null} />);

    expect(screen.queryByText(UI_LABELS.FILE_UPLOADER.INSTRUCTIONS)).not.toBeInTheDocument();
  });

  it("não renderiza instruções quando loading é true", () => {
    render(<FileUploader onFileUpload={mockOnFileUpload} loading={true} hasRoutes={false} error={null} />);

    expect(screen.queryByText(UI_LABELS.FILE_UPLOADER.INSTRUCTIONS)).not.toBeInTheDocument();
  });
});
