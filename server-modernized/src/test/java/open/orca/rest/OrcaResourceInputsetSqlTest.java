package open.orca.rest;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class OrcaResourceInputsetSqlTest {

    @Test
    void buildInputSetSql_wrapsHospnumAndInputcdConditions() {
        OrcaResource resource = new OrcaResource();
        String sql = resource.buildInputSetSql(1, true);
        assertEquals(
                "select * from tbl_inputcd where (hospnum=1 and (inputcd like 'P%' or inputcd like 'S%')) order by inputcd",
                sql
        );
    }

    @Test
    void buildInputSetSql_withoutHospnumOnlyFiltersInputcd() {
        OrcaResource resource = new OrcaResource();
        String sql = resource.buildInputSetSql(1, false);
        assertEquals(
                "select * from tbl_inputcd where (inputcd like 'P%' or inputcd like 'S%') order by inputcd",
                sql
        );
    }
}
