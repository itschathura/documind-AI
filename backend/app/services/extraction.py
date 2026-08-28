# import fitz  # PyMuPDF old 
import fitz


def extract_text(file_path: str) -> str:
    """
    extract text from pdf  ....
    """
    doc = fitz.open(file_path)

    full_text = ""
    for page in doc:
        full_text += page.get_text()

    doc.close()
    return full_text



#test in shell
# import fitz
# doc = fitz.open(r"C:/Users/chath/Downloads/project_report.pdf")
# print(doc[0].get_text())