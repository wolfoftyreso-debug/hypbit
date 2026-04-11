# Optional helper image baking tesseract data files for multi-language OCR.
FROM alpine:3.20
RUN apk add --no-cache tesseract-ocr \
    tesseract-ocr-data-eng \
    tesseract-ocr-data-swe \
    tesseract-ocr-data-deu \
    tesseract-ocr-data-fra
CMD ["tesseract", "--version"]
