interface ProfessionalStructuredDataProps {
  data: Array<Record<string, unknown>>;
}

export const ProfessionalStructuredData = ({ data }: ProfessionalStructuredDataProps) => (
  <>
    {data.map((entry) => {
      const schemaId = typeof entry['@id'] === 'string' ? entry['@id'] : null;
      const schemaType = typeof entry['@type'] === 'string' ? entry['@type'] : 'Schema';
      const schemaName = typeof entry.name === 'string' ? entry.name : schemaType;
      const schemaKey = schemaId || `${schemaType}:${schemaName}`;

      return (
        <script key={schemaKey} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      );
    })}
  </>
);
