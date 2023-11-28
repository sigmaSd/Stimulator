import { assertEquals } from "https://deno.land/std@0.208.0/assert/assert_equals.ts";
import {} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Inhibitor } from "./inhibit.ts";

const DECODER = new TextDecoder();
Deno.test("inhibit", () => {
  //FIXME: use ffi instead of shelling out
  function getInhibitors() {
    const output = DECODER.decode(
      new Deno.Command("gdbus", {
        args: [
          "call",
          "--session",
          "--dest",
          "org.gnome.SessionManager",
          "--object-path",
          "/org/gnome/SessionManager",
          "--method",
          "org.gnome.SessionManager.GetInhibitors",
        ],
      }).outputSync().stdout,
    );
    return [...output.matchAll(/Inhibitor\d+/g)].map((hit) => hit[0]);
  }
  const initialInhibitors = getInhibitors();
  const inh = new Inhibitor();
  inh.inhibit();
  assertEquals(getInhibitors().length, initialInhibitors.length + 1);
  const inh2 = new Inhibitor();
  inh2.inhibit();
  assertEquals(getInhibitors().length, initialInhibitors.length + 2);
  inh2.unInhibit();
  inh.unInhibit();
  assertEquals(getInhibitors().length, initialInhibitors.length);
});
