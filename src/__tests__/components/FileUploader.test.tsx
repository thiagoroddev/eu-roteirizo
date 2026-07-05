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

  it("renderiza o spoiler de instruções fechado por padrão, com os blocos multi-rota e rota única (RF-022.2)", () => {
    render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} hasRoutes={false} error={null} />);

    const summary = screen.getByText(UI_LABELS.FILE_UPLOADER.INSTRUCTIONS_SUMMARY);
    expect(summary).toBeInTheDocument();
    expect(summary.closest("details")).not.toHaveAttribute("open");
    expect(screen.getByText(UI_LABELS.FILE_UPLOADER.INSTRUCTIONS_MULTI_TITLE)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.FILE_UPLOADER.INSTRUCTIONS_SINGLE_TITLE)).toBeInTheDocument();
  });

  it("renderiza o botão 'Importar roteiro (.json)' desabilitado (liga na RF-013)", () => {
    render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} hasRoutes={false} error={null} />);

    expect(screen.getByRole("button", { name: UI_LABELS.FILE_UPLOADER.IMPORT_JSON_SOON })).toBeDisabled();
  });

  it("mostra o aviso de romaneio salvo quando manifestSave é 'saved'", () => {
    render(
      <FileUploader
        onFileUpload={mockOnFileUpload}
        loading={false}
        hasRoutes={true}
        error={null}
        manifestSave={{ status: "saved", meta: { id: "abc", fileName: "romaneio.xlsx", fileType: "", fileSize: 10, kind: "multi", routes: [], importedAt: "2026-07-05T10:00:00.000Z" } }}
      />
    );

    expect(screen.getByText(UI_LABELS.FILE_UPLOADER.MANIFEST_SAVED)).toBeInTheDocument();
  });

  it("mostra o aviso de duplicado com o nome do arquivo original (RN-23)", () => {
    render(
      <FileUploader
        onFileUpload={mockOnFileUpload}
        loading={false}
        hasRoutes={true}
        error={null}
        manifestSave={{ status: "duplicate", meta: { id: "abc", fileName: "original.xlsx", fileType: "", fileSize: 10, kind: "single", routes: [], importedAt: "2026-07-05T10:00:00.000Z" } }}
      />
    );

    expect(screen.getByText(UI_LABELS.FILE_UPLOADER.MANIFEST_DUPLICATE("original.xlsx"))).toBeInTheDocument();
  });

  it("mostra o aviso de falha de persistência quando manifestSave é 'error'", () => {
    render(<FileUploader onFileUpload={mockOnFileUpload} loading={false} hasRoutes={true} error={null} manifestSave={{ status: "error", reason: "quota" }} />);

    expect(screen.getByText(UI_LABELS.FILE_UPLOADER.MANIFEST_SAVE_ERROR)).toBeInTheDocument();
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

    expect(screen.queryByText(UI_LABELS.FILE_UPLOADER.INSTRUCTIONS_SUMMARY)).not.toBeInTheDocument();
  });

  it("não renderiza instruções quando loading é true", () => {
    render(<FileUploader onFileUpload={mockOnFileUpload} loading={true} hasRoutes={false} error={null} />);

    expect(screen.queryByText(UI_LABELS.FILE_UPLOADER.INSTRUCTIONS_SUMMARY)).not.toBeInTheDocument();
  });
});
