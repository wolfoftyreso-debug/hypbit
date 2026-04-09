{{/* Expand the name of the chart. */}}
{{- define "quixzoom-connector.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "quixzoom-connector.fullname" -}}
{{- default .Release.Name .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "quixzoom-connector.labels" -}}
app.kubernetes.io/name: {{ include "quixzoom-connector.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: wavult-os
{{- end -}}

{{- define "quixzoom-connector.selectorLabels" -}}
app.kubernetes.io/name: {{ include "quixzoom-connector.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
