export type PersonFeatureProps = {
  id: string;
  name: string;
  influence_score: number;
  relevance_score: number;
};

export type PersonFeature = {
  type: "Feature";
  properties: PersonFeatureProps;
  geometry: { type: "Point"; coordinates: [number, number] };
};

export type FeatureCollection = {
  type: "FeatureCollection";
  features: PersonFeature[];
};
