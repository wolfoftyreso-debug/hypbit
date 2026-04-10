// ------------------------------------------------------------
// Wavult Geopol — Neo4j production schema and seed data
// Run with:  cypher-shell -u neo4j -p password -f schema.cypher
// ------------------------------------------------------------
//
// Three layers:
//
//   1. Business Influence Layer (neutral, org-visible)
//        nodes:
//          (:Person), (:Organization), (:Event)
//        relationships:
//          (:Person)-[:CONNECTED {strength}]->(:Person)
//          (:Person)-[:WORKS_FOR {role, since}]->(:Organization)
//          (:Person)-[:ATTENDED {ts}]->(:Event)
//          (:Person)-[:INFLUENCES {weight}]->(:Person)
//          (:Organization)-[:INFLUENCES {weight}]->(:Organization)
//
//   2. Event / Intelligence Layer (what we've observed)
//        (:InfluenceEvent)  — normalized & enriched events from Kafka
//          produced by the influence-monitoring pipeline; optional to
//          materialize here for historical queries
//
//   3. Private Layer (user-scoped overlays, never mutates core)
//        (:User), (:PrivateNote), (:PrivateList)
//        (:User)-[:PRIVATE_CONTACT]->(:Person)
//        (:User)-[:OWNS]->(:PrivateNote)-[:ABOUT]->(:Person)
//        (:User)-[:HAS_LIST]->(:PrivateList)-[:INCLUDES]->(:Person)
// ------------------------------------------------------------

// ---------- Constraints ----------
CREATE CONSTRAINT person_id IF NOT EXISTS
FOR (p:Person) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT org_id IF NOT EXISTS
FOR (o:Organization) REQUIRE o.id IS UNIQUE;

CREATE CONSTRAINT event_id IF NOT EXISTS
FOR (e:Event) REQUIRE e.id IS UNIQUE;

CREATE CONSTRAINT influence_event_id IF NOT EXISTS
FOR (e:InfluenceEvent) REQUIRE e.event_id IS UNIQUE;

CREATE CONSTRAINT user_id IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

CREATE CONSTRAINT private_note_id IF NOT EXISTS
FOR (n:PrivateNote) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT private_list_id IF NOT EXISTS
FOR (l:PrivateList) REQUIRE l.id IS UNIQUE;

// ---------- Indexes ----------
CREATE INDEX person_name IF NOT EXISTS FOR (p:Person) ON (p.name);
CREATE INDEX person_influence IF NOT EXISTS FOR (p:Person) ON (p.influence_score);
CREATE INDEX person_relevance IF NOT EXISTS FOR (p:Person) ON (p.relevance_score);
CREATE INDEX person_visibility IF NOT EXISTS FOR (p:Person) ON (p.visibility_org);
CREATE INDEX org_name IF NOT EXISTS FOR (o:Organization) ON (o.name);
CREATE INDEX event_ts IF NOT EXISTS FOR (e:Event) ON (e.ts);
CREATE INDEX influence_event_ts IF NOT EXISTS FOR (e:InfluenceEvent) ON (e.ts);

// ---------- Seed: our own node ----------
MERGE (me:Person {id: "our_node"})
  SET me.name = "Wavult HQ",
      me.lat = 59.3293,
      me.lng = 18.0686,
      me.influence_score = 50,
      me.relevance_score = 100,
      me.visibility_org = true,
      me.visibility_private = false;

// ---------- Seed Organizations ----------
MERGE (amazon:Organization {id: "amazon"})
  SET amazon.name = "Amazon", amazon.sector = "retail/cloud";

MERGE (microsoft:Organization {id: "microsoft"})
  SET microsoft.name = "Microsoft", microsoft.sector = "cloud/enterprise";

MERGE (openai:Organization {id: "openai"})
  SET openai.name = "OpenAI", openai.sector = "ai";

MERGE (ec:Organization {id: "eu_commission"})
  SET ec.name = "European Commission", ec.sector = "government";

// ---------- Seed People (Business Influence Layer) ----------
MERGE (bezos:Person {id: "jeff_bezos"})
  SET bezos.name = "Jeff Bezos",
      bezos.lat = 47.6062,
      bezos.lng = -122.3321,
      bezos.influence_score = 98,
      bezos.relevance_score = 95,
      bezos.tags = ["tech", "space", "retail"],
      bezos.visibility_org = true,
      bezos.visibility_private = false;

MERGE (satya:Person {id: "satya_nadella"})
  SET satya.name = "Satya Nadella",
      satya.lat = 47.6426,
      satya.lng = -122.1396,
      satya.influence_score = 95,
      satya.relevance_score = 92,
      satya.tags = ["tech", "cloud", "ai"],
      satya.visibility_org = true,
      satya.visibility_private = false;

MERGE (sama:Person {id: "sam_altman"})
  SET sama.name = "Sam Altman",
      sama.lat = 37.7749,
      sama.lng = -122.4194,
      sama.influence_score = 93,
      sama.relevance_score = 99,
      sama.tags = ["ai", "startup"],
      sama.visibility_org = true,
      sama.visibility_private = false;

MERGE (ursula:Person {id: "ursula_vdl"})
  SET ursula.name = "Ursula von der Leyen",
      ursula.lat = 50.8503,
      ursula.lng = 4.3517,
      ursula.influence_score = 90,
      ursula.relevance_score = 88,
      ursula.tags = ["politics", "eu"],
      ursula.visibility_org = true,
      ursula.visibility_private = false;

// ---------- WORKS_FOR ----------
MATCH (p:Person {id: "jeff_bezos"}), (o:Organization {id: "amazon"})
MERGE (p)-[r:WORKS_FOR]->(o) SET r.role = "Founder", r.since = 1994;

MATCH (p:Person {id: "satya_nadella"}), (o:Organization {id: "microsoft"})
MERGE (p)-[r:WORKS_FOR]->(o) SET r.role = "CEO", r.since = 2014;

MATCH (p:Person {id: "sam_altman"}), (o:Organization {id: "openai"})
MERGE (p)-[r:WORKS_FOR]->(o) SET r.role = "CEO", r.since = 2019;

MATCH (p:Person {id: "ursula_vdl"}), (o:Organization {id: "eu_commission"})
MERGE (p)-[r:WORKS_FOR]->(o) SET r.role = "President", r.since = 2019;

// ---------- CONNECTED (person ↔ person) ----------
MATCH (a:Person {id: "jeff_bezos"}), (b:Person {id: "satya_nadella"})
MERGE (a)-[r:CONNECTED]->(b) SET r.strength = 0.7;

MATCH (a:Person {id: "satya_nadella"}), (b:Person {id: "sam_altman"})
MERGE (a)-[r:CONNECTED]->(b) SET r.strength = 0.9;

MATCH (a:Person {id: "our_node"}), (b:Person {id: "sam_altman"})
MERGE (a)-[r:CONNECTED]->(b) SET r.strength = 0.3;

MATCH (a:Person {id: "ursula_vdl"}), (b:Person {id: "satya_nadella"})
MERGE (a)-[r:CONNECTED]->(b) SET r.strength = 0.5;

// ---------- INFLUENCES (org ↔ org) ----------
MATCH (a:Organization {id: "eu_commission"}), (b:Organization {id: "amazon"})
MERGE (a)-[r:INFLUENCES]->(b) SET r.weight = 0.8;

MATCH (a:Organization {id: "eu_commission"}), (b:Organization {id: "microsoft"})
MERGE (a)-[r:INFLUENCES]->(b) SET r.weight = 0.8;

// ---------- Seed Events + ATTENDED ----------
MERGE (ws:Event {id: "web-summit-2024"})
  SET ws.name = "Web Summit Lisbon",
      ws.ts = 1731196800000,
      ws.location = "Lisbon";

MATCH (p:Person {id: "satya_nadella"}), (e:Event {id: "web-summit-2024"})
MERGE (p)-[r:ATTENDED]->(e) SET r.role = "keynote";

// ---------- Seed Private Layer (demo user) ----------
MERGE (u:User {id: "demo_user"})
  SET u.name = "Demo User";

MATCH (u:User {id: "demo_user"}), (p:Person {id: "sam_altman"})
MERGE (u)-[:PRIVATE_CONTACT]->(p);
