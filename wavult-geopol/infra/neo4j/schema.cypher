// ------------------------------------------------------------
// Wavult Geopol — Neo4j schema and seed data
// Run with:  cypher-shell -u neo4j -p password -f schema.cypher
// ------------------------------------------------------------
//
// Two layers:
//   1. Business Influence Layer (neutral, org-visible)
//        :Person, :Organization, :Event, :CONNECTED
//   2. Private Layer (user-scoped, overlays only)
//        :User, :PrivateNote, :PrivateList,
//        :PRIVATE_CONTACT, :OWNS, :ABOUT, :HAS_LIST, :INCLUDES
// ------------------------------------------------------------

// ---------- Constraints ----------
CREATE CONSTRAINT person_id IF NOT EXISTS
FOR (p:Person) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT org_id IF NOT EXISTS
FOR (o:Organization) REQUIRE o.id IS UNIQUE;

CREATE CONSTRAINT event_id IF NOT EXISTS
FOR (e:Event) REQUIRE e.id IS UNIQUE;

CREATE CONSTRAINT user_id IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

CREATE CONSTRAINT private_note_id IF NOT EXISTS
FOR (n:PrivateNote) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT private_list_id IF NOT EXISTS
FOR (l:PrivateList) REQUIRE l.id IS UNIQUE;

// ---------- Indexes ----------
CREATE INDEX person_name IF NOT EXISTS FOR (p:Person) ON (p.name);
CREATE INDEX person_influence IF NOT EXISTS FOR (p:Person) ON (p.influence_score);
CREATE INDEX person_visibility IF NOT EXISTS FOR (p:Person) ON (p.visibility_org);

// ---------- Seed: our own node ----------
MERGE (me:Person {id: "our_node"})
  SET me.name = "Wavult HQ",
      me.lat = 59.3293,
      me.lng = 18.0686,
      me.influence_score = 50,
      me.relevance_score = 100,
      me.visibility_org = true,
      me.visibility_private = false;

// ---------- Seed people (Business Influence Layer) ----------
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

// ---------- Seed relationships ----------
MATCH (a:Person {id: "jeff_bezos"}), (b:Person {id: "satya_nadella"})
MERGE (a)-[r:CONNECTED]->(b) SET r.strength = 0.7;

MATCH (a:Person {id: "satya_nadella"}), (b:Person {id: "sam_altman"})
MERGE (a)-[r:CONNECTED]->(b) SET r.strength = 0.9;

MATCH (a:Person {id: "our_node"}), (b:Person {id: "sam_altman"})
MERGE (a)-[r:CONNECTED]->(b) SET r.strength = 0.3;

MATCH (a:Person {id: "ursula_vdl"}), (b:Person {id: "satya_nadella"})
MERGE (a)-[r:CONNECTED]->(b) SET r.strength = 0.5;

// ---------- Seed Private Layer (demo user) ----------
MERGE (u:User {id: "demo_user"})
  SET u.name = "Demo User";

MATCH (u:User {id: "demo_user"}), (p:Person {id: "sam_altman"})
MERGE (u)-[:PRIVATE_CONTACT]->(p);
