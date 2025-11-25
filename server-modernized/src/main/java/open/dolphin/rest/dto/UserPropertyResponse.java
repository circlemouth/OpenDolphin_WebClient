package open.dolphin.rest.dto;

/**
 * User property response payload.
 */
public class UserPropertyResponse {

    private final Long id;
    private final String name;
    private final String value;
    private final String description;
    private final String category;
    private final String updateAt;

    public UserPropertyResponse(Long id,
                                String name,
                                String value,
                                String description,
                                String category,
                                String updateAt) {
        this.id = id;
        this.name = name;
        this.value = value;
        this.description = description;
        this.category = category;
        this.updateAt = updateAt;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getValue() {
        return value;
    }

    public String getDescription() {
        return description;
    }

    public String getCategory() {
        return category;
    }

    public String getUpdateAt() {
        return updateAt;
    }
}
