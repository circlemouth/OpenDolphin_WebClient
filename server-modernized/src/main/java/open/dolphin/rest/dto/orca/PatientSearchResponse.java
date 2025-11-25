package open.dolphin.rest.dto.orca;

/**
 * Response for POST /orca/patients/name-search.
 */
public class PatientSearchResponse extends AbstractPatientListResponse {

    private String searchTerm;

    public String getSearchTerm() {
        return searchTerm;
    }

    public void setSearchTerm(String searchTerm) {
        this.searchTerm = searchTerm;
    }
}
